//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");

const itemsSchema = {
  name : String
};

const Items = mongoose.model("Item", itemsSchema);

const item1 = new Items({
  name: "Welcome!"
});

const item2 = new Items({
  name: "Add new Item"
});

const item3 = new Items({
  name: "Delete new Item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Items.find({}, function(err, foundItems) {
    if(!err) {
      if(foundItems.length === 0 ) {
        Items.insertMany(defaultItems, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("successfully saved!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });  
});

app.get("/:customListName", function(req, res) {
  const customListName = _.lowerCase(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: _.upperCase(foundList.name), newListItems: foundList.items});
      }
    }
  })
});

app.post("/", function(req, res) {
  const newItemName = req.body.newItem;  
  const listName = req.body.list;
  const newItem = new Items({
    name: newItemName
  });

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if(!err) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  //console.log(req.body.checkbox);
  const deleteItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Items.findByIdAndRemove({_id: deleteItem}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("deleted!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deleteItem}}}, function(err) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
