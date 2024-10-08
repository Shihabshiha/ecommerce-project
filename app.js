var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");

var app = express();
const helpers = require("./helpers/helpers");

var userRouter = require("./routes/users");
var adminRouter = require("./routes/admin");

require("dotenv").config();

var session = require("express-session");
const nocache = require("nocache");
var db = require("./config/connections");
const productHelpers = require("./helpers/productHelpers");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
    helpers: helpers,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    key: "user_id",
    secret: "thisthekeyforuser",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6000000 },
  })
);

app.use(nocache());

db.connect((err) => {
  if (err) console.log("connection error" + err);
  else console.log("Database connected to port 27017");
});

app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
