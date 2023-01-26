const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API for Returns a list of all todos
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT 
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%' and status = '${status}'; 
      `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT 
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%' and priority = '${priority}'; 
      `;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT 
        *
      FROM
        todo
      WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}'
    AND priority = '${priority}';`;

      break;

    default:
      getTodosQuery = `
      SELECT 
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%'; 
      `;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API for Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
  SELECT
    *
  FROM
    todo
    WHERE
        id = ${todoId};
  `;

  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

//API for Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;

  const createTodoQuery = `
    INSERT INTO todo
        (id, todo, priority, status)
    VALUES
        (${id}, '${todo}', '${priority}', '${status}');
    `;

  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API for Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoProperty = request.body;

  let updateColumn = "";

  switch (true) {
    case todoProperty.status !== undefined:
      updateColumn = "Status";
      break;
    case todoProperty.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoProperty.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const existingTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};
  `;

  const existingTodo = await db.get(existingTodoQuery);

  const {
    todo = existingTodo.todo,
    priority = existingTodo.priority,
    status = existingTodo.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId};
  `;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API for Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE
    FROM
        todo
    WHERE
        id = ${todoId};
    `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
