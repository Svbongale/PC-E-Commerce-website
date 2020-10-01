var mongoose = require("mongoose");


var orderSchema = new mongoose.Schema({
    custName: String,
    PhNo: String,
    email: String,
    created: {type: Date,default: Date.now},
    name: String, 
    image:{ 
        data: Buffer, 
        contentType: String,
    },
    type: String, 
    price: Number,
    weight: Number,
    catogory: String,
});


module.exports = mongoose.model("Order", orderSchema);
