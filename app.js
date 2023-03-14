const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended:"true"}));
app.use(express.static("public"));

//connecting to mongo db
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser:true});
//creating schema
const itemsSchema = {
    name:String
};

const listScheme = {
    name:String,
    items:[itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List",listScheme);
const item1 = new Item({ name:"Welcome to your todolist!"});
const item2 = new Item({ name:"Hit the + button to add a new Item."});
const item3 = new Item({ name:"<-- hit this to delete the item."});
const defaultItems = [item1,item2,item3];

//creating new documents using documents

app.set("view engine", 'ejs');

app.get("/", function(req,res){
//add default items only if the database is empty, otherwise dont add
    Item.find({})
    .then((foundItems)=>{
        if(foundItems.length===0){
            //inserting into database
            Item.insertMany(defaultItems)
            .then((result)=>{
                console.log("Added to database");
            })
            .catch((error)=>{
                console.log("error");
            });
        }
        res.render('list', {listTitle:"Today", newListItems:foundItems});
    })
    .catch((error)=>{
        console.log(error);
    })

   
});

app.get("/:customListName", async function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    let foundList = await List.findOne({name:customListName});
    if(foundList==null){
        const list = new List({
            name:customListName,
            items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
    }
    else{
        res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
    } 
});


app.post("/", async function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item ({name:itemName});

    if(listName==="Today"){
    item.save();
    res.redirect("/");
    }
    else{
        let foundList = await List.findOne({name:listName});
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        }
    }
    
)





app.get("/about", function(req,res){
    res.render("about.ejs");
})

app.post("/delete", async function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName ==="Today"){
        Item.findByIdAndRemove(checkedItemId)
    .then(()=>{
        res.redirect("/");
    })
    .catch((error)=>{
        console.log(error);
    });
    }
    else{
        let foundList = await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}});
        res.redirect("/"+listName);
    }  
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});