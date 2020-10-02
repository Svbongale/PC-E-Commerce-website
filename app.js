// =================================================================
// Require statements for dependencies
// =================================================================


var express               = require("express"),
    app                   = express(),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    methodOverride        = require("method-override"),
    expressSanitizer      = require("express-sanitizer"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    Catalogue             = require("./models/catalogue"),
    Order                 = require("./models/orders"),
    User                  = require("./models/user"),  
    CustomOrder           = require("./models/custom"),
    passportLocalMongoose = require("passport-local-mongoose");

var fs   = require('fs'); 
var path = require('path'); 
           require('dotenv/config');


// =================================================================
// CONNECT MONGOOSE TO DB
// =================================================================
mongoose.connect("mongodb://localhost/PCApp",{useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify: false });


var fs = require('fs'); 
var path = require('path'); 
var multer = require('multer'); 

var storage = multer.diskStorage({ 
	destination: (req, file, cb) => { 
		cb(null, 'uploads') 
	}, 
	filename: (req, file, cb) => { 
		cb(null, file.fieldname + '-' + Date.now()) 
	} 
}); 

var upload = multer({ storage: storage }); 


// =================================================================
// Use statements to use required dependencies
// =================================================================

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method")); // Sanitizer must always come after body parser.
app.use(expressSanitizer());  

// =================================================================
// PASSPORT CONFIGURATION
// =================================================================


app.use(require("express-session")({
	secret : "Once again",
	resave: false,
	saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});


// *****************************************************************
// RESTful ROUTES
// *****************************************************************

app.get("/", function(req, res){
    res.render("landing.ejs");
});


// =================================================================
// VIEW CATALOGUE ROUTE
// =================================================================

app.get("/catalogue",function(req, res){
    Catalogue.find({},function(err,catalogues){
        if(err){
            console.log("somthing went wrong");
            console.log(err);
          }else{
              res.render("catalogues/index.ejs",{catalogues:catalogues,currentUser: req.user});
          }  
      });
});



// =================================================================
// ADD NEW PRODUCT TO CATALOGUE ROUTE
// =================================================================


app.get("/catalogue/new",isLoggedIn,function(req, res){
    res.render("catalogues/new.ejs");
});

app.post("/catalogue",upload.single('image'),function(req,res,next){
    
    var name     = req.body.name,
        image    = { 
                 data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
                 contentType: 'image/jpeg'
                  },
        type     = req.body.type, 
        price    = req.body.price,
        weight   = req.body.weight,
        catogory = req.body.catogory;

    var newProduct = {name:name,image:image,type:type,price:price,weight:weight,catogory:catogory};
        Catalogue.create(newProduct,function(err,newlyCreated){       
        if(err){
            console.log("Somthing went wrong!!");
            console.log(err);
        }else{
            console.log(image);
            res.redirect("/catalogue");
        }
    });
});


// =================================================================
// SHOW CATALOGUE PRODUCT ROUTE
// =================================================================
app.get("/catalogue/:id", function(req, res){
    Catalogue.findById(req.params.id,function(err,foundProduct){
        if(err){
            res.redirect("/catalogue");
            console.log(err);
        }else{
            res.render("catalogues/show.ejs",{catalogues:foundProduct});
        }
    });
});


// =================================================================
// EDIT CATALOGUE PRODUCT ROUTE 
// =================================================================

app.get("/catalogue/:id/edit",isLoggedIn,function(req, res){
    Catalogue.findById(req.params.id,function(err,foundProduct){
        if(err){
            res.redirect("/admin");
            console.log(err);
        }else{
            res.render("catalogues/edit.ejs",{catalogues:foundProduct});
        }
    });
});


// =================================================================
// UPDATE CATALOGUE PRODUCT ROUTE
// =================================================================

app.put("/catalogue/:id", function(req,res){
    Catalogue.findByIdAndUpdate(req.params.id,req.body.catalogue,function(err,updatedProduct){
        if(err){
            console.log(err);
            res.redirect("/catalogue");
        }else{
            res.redirect("/catalogue/" + req.params.id);
        }
    });
});


// =================================================================
// DELETE PRODUCT FROM CATALOGUE ROUTE 
// =================================================================

app.delete('/catalogue/:id',isLoggedIn, function(req,res){
    Catalogue.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/catalogue");
        }
    });
});


// =================================================================
// VIEW ADMIN PAGE ROUTE
// =================================================================
app.get("/admin",isLoggedIn,function(req, res){
    res.render("admin.ejs");
});


// =================================================================
// VIEW ORDER-DETAILS ROUTE (Customer Access)
// =================================================================

app.get("/orders/:id/orderDetails",function(req, res){
    Catalogue.findById(req.params.id,function(err,foundProductDetails){
        if(err){
            res.redirect("/catalogue");
            console.log(err);
        }else{
            res.render("orders/orderDetails.ejs",{catalogues:foundProductDetails});
        }
    });
});

// =================================================================
// CONFIRM ORDER-DETAILS ROUTE (Customer Access to enter customer details)
// =================================================================

app.get("/orders/:id/confirm",function(req,res){
    Catalogue.findById(req.params.id,function(err,confirmDetails){
        if(err){
            res.redirect("/catalogue/:id");
            console.log(err);
        }else{
            res.render("orders/confirm.ejs",{catalogues:confirmDetails});
        }
    });
});

// =================================================================
// VIEW ALL INCOMING ORDERS ROUTE (Admin Access)
// =================================================================

app.get("/admin/orders",isLoggedIn,function(req, res){
    
    Order.find({},function(err,foundOrders){
        if(err){
            console.log(err);
        }else{
            res.render("orders/show.ejs",{orders:foundOrders});
        }
    });
});

// =================================================================
// CONFIRM ORDER-DETAILS ROUTE (CUSTOMER)
// =================================================================

app.post("/admin/orders",upload.single('image'),function(req,res){
    
    Catalogue.findById(req.body.image).then(function(found){
  
    var custName = req.body.custName,
        image    = found.image,
        PhNo     = req.body.PhNo,
        email    = req.body.email,
        // PRODUCT INFO
        name     = found.name,
        weight   = found.weight,
        type     = found.type,
        price    = found.price,
        catogory = found.catogory;

        var newOrder = {custName:custName,PhNo:PhNo,email:email,name:name,weight:weight,type:type,price:price,catogory:catogory,image:image};
        Order.create(newOrder,function(err,newlyOrdered){
            if(err){
                console.log(err);
            }else{
                res.redirect("/catalogue");
            }
        });
    }).catch(function(err){
        console.log(err);
    });  
});


// =================================================================
// CUSTOM ORDER ROUTE
// =================================================================

app.get("/order/custom",function(req,res){
    res.render("orders/custom.ejs");
});

// =================================================================
// CUSTOM ORDER POST ROUTE
// =================================================================
app.post("/order/custom",upload.single('image'),function(req,res){

    var custName = req.body.custName,
        PhNo     = req.body.PhNo,
        email    = req.body.email,
        // PRODUCT INFO
        name     = req.body.name,
        weight   = req.body.weight,
        type     = req.body.type,
        catogory = req.body.catogory,
        image    = { 
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
            contentType: 'image/jpeg'
             };  

    var newOrder = {custName:custName,PhNo:PhNo,email:email,name:name,weight:weight,type:type,catogory:catogory,image:image};
        
    CustomOrder.create(newOrder,function(err,newlyOrdered){
            if(err){
                console.log(err);
            }else{
                res.redirect("/catalogue");
            }
        });
});

// =================================================================
// VIEW ALL INCOMING CUSTOM ORDERS ROUTE (Admin Access)
// =================================================================

app.get("/admin/customOrders",isLoggedIn,function(req, res){
    
    CustomOrder.find({},function(err,foundOrders){
        if(err){
            console.log(err);
        }else{
            res.render("orders/showCustom.ejs",{customorders:foundOrders});
        }
    });
});


// =================================================================
// ACCEPT/REJECT CUSTOM ORDERS ROUTE (Admin Access)
// =================================================================

app.get("/orders/:id/CustomAcceptReject",isLoggedIn,function(req,res){

    CustomOrder.findById(req.params.id,function(err,foundaccept){
        if(err){
            console.log(err);
        }else{
            res.render("orders/CustomAcceptReject.ejs",{customorders:foundaccept});
        }
    });    
});

// =================================================================
// DELETE CUSTOM ORDERS ROUTE (Admin Access)
// =================================================================

app.delete('/Customorders/:id',isLoggedIn, function(req,res){
    CustomOrder.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/admin/customOrders");
        }
    });
});


// =================================================================
// ACCEPT/REJECT ORDERS ROUTE (Admin Access)
// =================================================================

app.get("/orders/:id/acceptReject",isLoggedIn,function(req,res){

    Order.findById(req.params.id,function(err,foundaccept){
        if(err){
            console.log(err);
        }else{
            res.render("orders/acceptReject.ejs",{orders:foundaccept});
        }
    });    
});


// =================================================================
// DELETE NORMAL ORDERS ROUTE (Admin Access)
// =================================================================

app.delete('/orders/:id',isLoggedIn, function(req,res){
    Order.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/admin/orders");
        }
    });
});


// ==================================
// *****************************************************************
// AUTHENTICATION ROUTES
// *****************************************************************
// ==================================

// =================================================================
// REGISTRATION ROUTE
// =================================================================
app.get("/register",function(req,res){
	res.render("register.ejs");
});


// =================================================================
// HANDEL REGISTRATION
// =================================================================
app.post("/register",function(req,res){
	var newUser = new User({username:req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
		res.redirect("/catalogue");
		});
	});
});

// =================================================================
// LOGIN ROUTES
// =================================================================


app.get("/login",function(req,res){
	res.render("login.ejs");
});

// =================================================================
// LOGIN HANDLER USING MIDDLEWARE
// =================================================================

app.post("/login",passport.authenticate("local", {
    successRedirect:"/admin",
    failureRedirect:"/login"
}),function(req,res){
});

// =================================================================
// LOGOUT ROUTES
// =================================================================
app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/catalogue");
});

// =================================================================
// MIDDLEWARE
// =================================================================

function isLoggedIn(req, res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
};

// =================================================================
// LISTNER AND PORT CONFIGURATION
// =================================================================

app.listen(3000, function(){ 
    console.log("This is the Sathyan-App");
    console.log('Server listening on port 3000'); 
  });

