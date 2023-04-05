const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const path = require("path");
let db = null;
const dbpath = path.join(__dirname, "todoApplication.db");
const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`dbError:${e.message}`);
    process.exit(1);
  }
};

InitializeAndStartServer();
const ValidateDetails = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
    date = "",
  } = request.query;

  if (
    status !== "" &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "" &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "" &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (date !== "" && isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const ValidateDetail = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    todo = "",
    dueDate = "",
  } = request.body;
  if (
    status !== "" &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "" &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "" &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== "" && isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

//todos

app.get("/todos/", ValidateDetails, async (request, response) => {
  try {
    const {
      status = "",
      priority = "",
      date = "",
      category = "",
      search_q = "",
    } = request.query;
    const todoslist = `SELECT * FROM todo WHERE status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND category LIKE '%${category}%' AND todo LIKE '%${search_q}%' AND due_date LIKE '%${date}%';`;
    const dbResponse = await db.all(todoslist);
    const camel = [];
    for (let each of dbResponse) {
      const h = {
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      };
      camel.push(h);
    }
    response.send(camel);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//specific todo
app.get("/todos/:todoId/", ValidateDetails, async (request, response) => {
  try {
    const { todoId } = request.params;
    const gettodo = `SELECT * FROM todo WHERE id=${todoId};`;
    const dbResponse = await db.get(gettodo);
    response.send({
      id: dbResponse.id,
      todo: dbResponse.todo,
      priority: dbResponse.priority,
      status: dbResponse.status,
      category: dbResponse.category,
      dueDate: dbResponse.due_date,
    });
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//based on due date

app.get("/agenda/", ValidateDetails, async (request, response) => {
  try {
    const { date } = request.query;
    const newdate = new Date(date);
    const month = newdate.getMonth() + 1;
    const gettodos = `SELECT * FROM todo WHERE CAST(strftime("%Y",due_date)AS INTEGER)=${newdate.getFullYear()} AND CAST(STRFTIME("%m",due_date)AS INTEGER)=${month} AND CAST(STRFTIME("%d",due_date)AS INTEGER)=${newdate.getDate()};`;
    const dbResponse = await db.all(gettodos);
    const camel = [];
    for (let each of dbResponse) {
      const h = {
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      };
      camel.push(h);
    }
    response.send(camel);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//add todo

app.post("/todos/", ValidateDetail, async (request, response) => {
  try {
    const { id, todo, priority, status, category, dueDate } = request.body;
    const addtodo = `INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    await db.run(addtodo);
    response.send("Todo Successfully Added");
  } catch (e) {
    console.log(`db Error ${e.message}`);
  }
});

//update todo

app.put("/todos/:todoId/", ValidateDetail, async (request, response) => {
  try {
    const { todoId } = request.params;
    const { todo, priority, status, category, dueDate } = request.body;
    let responseMessage = null;
    let update = null;
    let newChange = null;
    if (todo !== undefined) {
      responseMessage = `Todo Updated`;
      update = "todo";
      newChange = todo;
    } else if (priority !== undefined) {
      responseMessage = "Priority Updated";
      update = "priority";
      newChange = priority;
    } else if (status !== undefined) {
      responseMessage = "Status Updated";
      update = "status";
      newChange = status;
    } else if (category !== undefined) {
      responseMessage = "Category Updated";
      update = "category";
      newChange = category;
    } else if (dueDate !== undefined) {
      responseMessage = "Due Date Updated";
      update = "due_date";
      newChange = dueDate;
    }

    //console.log(responseMessage);
    //console.log(update);
    console.log(newChange);
    const updateQuery = `UPDATE todo SET '${update}'='${newChange}' WHERE id=${todoId};`;
    await db.run(updateQuery);
    response.send(responseMessage);
  } catch (e) {
    console.log(`db ERROR ${e.message}`);
  }
});

//delete todo

const deleteTodo = app.delete(
  "/todos/:todoId",
  ValidateDetails,
  async (request, response) => {
    try {
      const { todoId } = request.params;
      const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
      await db.run(deleteQuery);
      response.send("Todo Deleted");
    } catch (e) {
      console.log(`DB ERROR ${e.message}`);
    }
  }
);

module.exports = deleteTodo;
