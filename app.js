const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect("mongodb+srv://ashenafiabebaw02:kdNfSyUH7vHvMMNU@cluster0.o4bgfac.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error(error);
  });

// Create Schema
const itemsSchema = mongoose.Schema({
  name: String
});

// Create Model
const Item = mongoose.model("Item", itemsSchema);

// Create Documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "Hit the checkbox to delete an item."
});

const defaultItems = [item1, item2, item3];

const ListSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", ListSchema);


app.get("/", function (req, res) {

  Item.find({}, function (err, founditems) {

    if (founditems.length === 0) {
      // Insert Documents
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Successfully saved default item to DB.");
        })
        .catch((error) => {
          console.error(error);
        });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: founditems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
        //console.log("Doesn't exist");
      }
      else {
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        // console.log("Exists");
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        console.log("Successfully saved item to DB.");
        res.redirect("/");
      })
      .catch((error) => {
        console.error(error);
      });

  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save()
        .then(() => {
          console.log("Successfully saved foundList to DB.");
          res.redirect("/" + listName);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = (req.body.checkbox);
  const listName = req.body.listName;
if(listName === "Today"){
  
  Item.findByIdAndRemove(checkedItemId, function (err) {
    if (!err) {
      console.log("Successfully deleted item from DB.");
      res.redirect("/");
    }
  });

} else{
   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
}
});
}
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
