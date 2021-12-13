/*********************************************************************************
* BTI325 – Assignment 6
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Theodore Rusu Student ID: 101613206 Date: Dec 12, 2021
*
* Online (Heroku) Link: ________________________________________________________
*
********************************************************************************/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const app = express();

const multer = require('multer');
const fs = require('fs');
const dataService = require('./data-service');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const dataServiceAuth = require('./data-service-auth');
const clientSessions = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;

var on_http = function() {
	console.log('Express http server listening on ' + HTTP_PORT);
};

app.engine(
	'.hbs',
	exphbs.engine({
		extname: '.hbs',

		helpers: {
			navLink: function(url, options) {
				return (
					'<li' +
					(url == app.locals.activeRoute ? ' class = "active" ' : '') +
					'><a href="' +
					url +
					'">' +
					options.fn(this) +
					'</a> </li>'
				);
			}, // helpers: navLink
			/* e.g.,
              {{#equal employee.status "Full Time" }}checked{{/equal}} */
			equal: function(lvalue, rvalue, options) {
				if (arguments.length < 3) throw new Error('Handlebars Helper equal needs 2 parameters.');
				if (lvalue != rvalue) {
					return options.inverse(this);
				} else {
					return options.fn(this);
				}
			} // helpers:equal
		}, //// helpers
		defaultLayout: 'main',
		handlebars: allowInsecurePrototypeAccess(Handlebars)
	})
);
app.set('view engine', '.hbs');
//handlebars engine

//property activeRoute
app.use(function(req, res, next) {
	let route = req.baseUrl + req.path;
	app.locals.activeRoute = route == '/' ? '/' : route.replace(/\/$/, '');
	next();
});

//storage variable
const storage = multer.diskStorage({
	destination: './public/images/uploaded',
	filename: function(req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

//upload variable
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('./public/'));

//clientSessions middleware
app.use(
	clientSessions({
		cookieName: 'session',
		secret: 'LongSecretForA5',
		duration: 2 * 60 * 1000,
		activeDuration: 1000 * 60
	})
);

//Middleware function
app.use(function(req, res, next) {
	res.locals.session = req.session;
	next();
});

//ensureLogin function
function ensureLogin(req, res, next) {
	if (!req.session.user) {
		res.redirect('/login');
	} else {
		next();
	}
}

//home
app.get('/', (req, res) => {
	res.render('home');
});

//about
app.get('/about', (req, res) => {
	res.render('about');
});

//employees
app.get('/employees', ensureLogin, (req, res) => {
	if (req.query.status) {
		dataService
			.getEmployeesByStatus(req.query.status)
			.then(function(data) {
				if (data.length > 0) {
					res.render('employees', { employees: data });
				} else {
					res.render('employees', { message: 'no results' });
				}
			})
			.catch(function(err) {
				res.render(err);
			});
	} else if (req.query.department) {
		dataService
			.getEmployeesByDepartment(req.query.department)
			.then(function(data) {
				if (data.length > 0) {
					res.render('employees', { employees: data });
				} else {
					res.render('employees', { message: 'no results' });
				}
			})
			.catch(function(err) {
				res.render(err);
			});
	} else if (req.query.manager) {
		dataService
			.getEmployeesByManager(req.query.manager)
			.then(function(data) {
				if (data.length > 0) {
					res.render('employees', { employees: data });
				} else {
					res.render('employees', { message: 'no results' });
				}
			})
			.catch(function(err) {
				res.render(err);
			});
	} else {
		dataService
			.getAllEmployees()
			.then(function(data) {
				if (data.length > 0) {
					res.render('employees', { employees: data });
				} else {
					res.render('employees', { message: 'no results' });
				}
			})
			.catch(function(err) {
				res.render(err);
			});
	}
});

//employee/empNum route param
app.get('/employee/:empNum', ensureLogin, (req, res) => {
	// initialize an empty object to store the values
	let viewData = {};

	dataService
		.getEmployeeByNum(req.params.empNum)
		.then((data) => {
			if (data) {
				viewData.employee = data; //store employee data in the "viewData" object as "employee"
			} else {
				viewData.employee = null; // set employee to null if none were returned
			}
		})
		.catch(() => {
			viewData.employee = null; // set employee to null if there was an error
		})
		.then(dataService.getDepartments)
		.then((data) => {
			viewData.departments = data; // store department data in the "viewData" object as "departments"

			// loop through viewData.departments and once we have found the departmentId that matches
			// the employee's "department" value, add a "selected" property to the matching
			// viewData.departments object

			for (let i = 0; i < viewData.departments.length; i++) {
				if (viewData.departments[i].departmentId == viewData.employee.department) {
					viewData.departments[i].selected = true;
				}
			}
		})
		.catch(() => {
			viewData.departments = []; // set departments to empty if there was an error
		})
		.then(() => {
			if (viewData.employee == null) {
				// if no employee - return an error
				res.status(404).send('Employee Not Found');
			} else {
				res.render('employee', { viewData: viewData }); // render the "employee" view
			}
		});
});

//add employees
app.get('/employees/add', ensureLogin, (req, res) => {
	dataService
		.getDepartments()
		.then(function(data) {
			res.render('addEmployee', { departments: data });
		})
		.catch(function(err) {
			res.render('addEmployee', { departments: [] });
		});
});

app.get('/employees/delete/:empNum', ensureLogin, (req, res) => {
	dataService
		.deleteEmployeeByNum(req.params.empNum)
		.then(function(data) {
			res.redirect('/employees');
		})
		.catch(function(err) {
			res.status(500).send('Unable to Remove Employee / Employee not found');
		});
});

//employees form post
app.post('/employees/add', ensureLogin, (req, res) => {
	dataService
		.addEmployee(req.body)
		.then(function(data) {
			res.redirect('/employees');
		})
		.catch(function(err) {
			res.send(err);
		});
});

//employee form update post
app.post('/employee/update', ensureLogin, (req, res) => {
	dataService
		.updateEmployee(req.body)
		.then(function(data) {
			res.redirect('/employees');
		})
		.catch(function(err) {
			res.send(err);
		});
});

//departments
app.get('/departments', ensureLogin, (req, res) => {
	dataService
		.getDepartments()
		.then(function(data) {
			if (data.length > 0) {
				res.render('departments', { departments: data });
			} else {
				res.render('departments', { message: 'no results' });
			}
		})
		.catch(function(err) {
			res.send(err);
		});
});

//department/departmentId route param
app.get('/department/:departmentId', ensureLogin, (req, res) => {
	dataService
		.getDepartmentById(req.params.departmentId)
		.then(function(data) {
			// res.json(data);
			if (!data) {
				res.status(404).send('Department Not Found');
			} else {
				res.render('department', { department: data });
			}
		})
		.catch(function(err) {
			res.status(404).send('Department Not Found');
		});
});

//add departments
app.get('/departments/add', ensureLogin, (req, res) => {
	res.render('addDepartment');
});

//departments form post
app.post('/departments/add', ensureLogin, (req, res) => {
	dataService
		.addDepartment(req.body)
		.then(function(data) {
			res.redirect('/departments');
		})
		.catch(function(err) {
			res.send(err);
		});
});

//department form update post
app.post('/department/update', ensureLogin, (req, res) => {
	dataService
		.updateDepartment(req.body)
		.then(function(data) {
			res.redirect('/departments');
		})
		.catch(function(err) {
			res.send(err);
		});
});

//add images
app.get('/images/add', ensureLogin, (req, res) => {
	res.render('addImage');
});

//images
app.get('/images', ensureLogin, (req, res) => {
	fs.readdir(path.join(__dirname, '/public/images/uploaded'), (err, files) => {
		res.render('images', { images: files });
	});
});

//imagefile form post
app.post('/images/add', ensureLogin, upload.single('imageFile'), (req, res) => {
	res.redirect('/images');
});

//login route
app.get('/login', (req, res) => {
	res.render('login');
});

//register route
app.get('/register', (req, res) => {
	res.render('register');
});

//register form post
app.post('/register', (req, res) => {
	dataServiceAuth
		.registerUser(req.body)
		.then(() => {
			res.render('register', { successMessage: 'User created' });
		})
		.catch((err) => {
			res.render('register', { errorMessage: err, userName: req.body.userName });
		});
});

//register form post
app.post('/login', (req, res) => {
	req.body.userAgent = req.get('User-Agent');
	dataServiceAuth
		.checkUser(req.body)
		.then((user) => {
			req.session.user = {
				userName: user.userName, // complete it with authenticated user's userName
				email: user.email, // complete it with authenticated user's email
				loginHistory: user.loginHistory // complete it with authenticated user's loginHistory
			};
			res.redirect('/employees');
		})
		.catch((err) => {
			res.render('login', { errorMessage: err, userName: req.body.userName });
		});
});

//logout route
app.get('/logout', (req, res) => {
	req.session.reset();
	res.redirect('/login');
});

//user history route
app.get('/userHistory', ensureLogin, (req, res) => {
	res.render('userHistory');
});

//404
app.get('*', (req, res) => {
	res.status(404).send('Page not found.');
});

dataService
	.initialize()
	.then(dataServiceAuth.initialize())
	.then(function() {
		app.listen(HTTP_PORT, on_http);
	})
	.catch(function(err) {
		console.log('unable to start server: ' + err);
	});
