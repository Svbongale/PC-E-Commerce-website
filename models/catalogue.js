var mongoose = require("mongoose");


var catalogueSchema = new mongoose.Schema({
    name: String, 
    image:{ 
        data: Buffer, 
        contentType: String
    },
    type: String, 
    price: Number,
    weight: Number,
    catogory: String,

});


module.exports = mongoose.model("Catalogue", catalogueSchema);