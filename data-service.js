const Sequelize = require('sequelize');

var sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL_REQUIRE === 'true',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      },
    },
  }
);

sequelize
  .authenticate()
  .then(() => console.log('Connection success.'))
  .catch((err) => console.log('Unable to connect to DB.', err));

var Employee = sequelize.define(
  'Employee',
  {
    employeeNum: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING,
  },
  {
    createdAt: false,
    updatedAt: false,
  }
);

var Department = sequelize.define(
  'Department',
  {
    departmentId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    departmentName: Sequelize.STRING,
  },
  {
    createdAt: false,
    updatedAt: false,
  }
);

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject('Unable to sync DB.');
      });
  }); // promise end
}; //initialize

module.exports.getAllEmployees = function () {
  return new Promise((resolve, reject) => {
    Employee.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('No results returned.');
      }); //catch
  }); // promise
}; // getAllEmployees

module.exports.getEmployeesByStatus = function (status_query) {
  return new Promise((resolve, reject) => {
    Employee.findAll({
      where: { status: status_query },
    })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('No query results.');
      }); //catch
  }); //promise
};

module.exports.getEmployeesByDepartment = function (department_query) {
  return new Promise((resolve, reject) => {
    Employee.findAll({
      where: { department: department_query },
    })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('No query results.');
      }); //catch
  }); // promise
};

module.exports.getEmployeesByManager = function (manager_query) {
  return new Promise((resolve, reject) => {
    Employee.findAll({
      where: { employeeManagerNum: manager_query },
    })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('No results returned!');
      }); //catch
  }); // promise
};

module.exports.getEmployeeByNum = function (value) {
  return new Promise((resolve, reject) => {
    Employee.findAll({
      where: { employeeNum: value },
    })
      .then((data) => {
        resolve(data[0]);
      })
      .catch((err) => {
        reject('No result.');
      });
  });
};

module.exports.addEmployee = function (employeeData) {
  return new Promise((resolve, reject) => {
    // object employeeData is from user's input (req.query.body)
    employeeData.isManager = employeeData.isManager ? true : false;
    for (let prop in employeeData) {
      if (employeeData[prop] == '') employeeData[prop] = null;
    } // set '' to null for object property values
    // object employeeData is ready to be created (added) to table (model) Employee
    Employee.create(employeeData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject('Cannot add employee.');
      });
  });
};

module.exports.updateEmployee = function (employeeData) {
  return new Promise((resolve, reject) => {
    employeeData.isManager = employeeData.isManager ? true : false;
    for (let prop in employeeData) {
      if (employeeData[prop] == '') employeeData[prop] = null;
    }
    Employee.update(employeeData, {
      where: { employeeNum: employeeData.employeeNum },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject('cannot update.');
      });
  });
};

module.exports.deleteEmployeeByNum = function (empNum) {
  return new Promise((resolve, reject) => {
    Employee.destroy({
      where: { employeeNum: empNum },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject('Unable to delete employee.');
      });
  });
};

//department
module.exports.getDepartments = function () {
  return new Promise((resolve, reject) => {
    Department.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('No results.');
      }); //catch
  }); // promise
};

module.exports.addDepartment = function (departmentData) {
  return new Promise((resolve, reject) => {
    for (let prop in departmentData) {
      if (departmentData[prop] == '') departmentData[prop] = null;
    }
    Department.create(departmentData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject('Cannot add department');
      }); // catch
  }); // promise
};

module.exports.updateDepartment = function (departmentData) {
  return new Promise((resolve, reject) => {
    for (let prop in departmentData) {
      if (departmentData[prop] == '') {
        departmentData[prop] = null;
      }
    }
    Department.update(departmentData, {
      where: { departmentId: departmentData.departmentId },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject('Cannot update Department.');
      }); // catch
  }); // promise
};

module.exports.getDepartmentById = function (id) {
  return new Promise((resolve, reject) => {
    Department.findAll({ where: { departmentId: id } })
      .then((data) => {
        resolve(data[0]);
      })
      .catch((err) => {
        reject('Cannot find the department by Id.');
      }); // catch
  }); // promise
};
