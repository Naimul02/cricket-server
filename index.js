const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f21lusd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    
        const allProductsCollection =  client.db('Website3').collection('allproducts');
        const addToCartCollection =  client.db('Website3').collection('addtocart');
        const confirmOrderCollection =  client.db('Website3').collection('confirmOrder');
        const usersCollection =  client.db('Website3').collection('users');
        



        // jwt
        app.post('/jwt' , async(req , res) => {
              const user = req.body;
              const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , { expiresIn : '1hr'});
              res.send({token});
        })
        // verifyToken
        const verifyToken = (req , res , next) => {
              if(!req.headers.authorization){
                  console.log("authorization error : " , req.headers.authorization)
                  return res.status(401).send({message : 'forbidden access'})
              }
              const token = req?.headers?.authorization.split(" ")[1];
              console.log("token : " , token);
              jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
                    
                  if(err){
                        console.log("verifytoken error : " , err)
                        return res.status(401).send({message  : 'forbidden access'})
                    }
                    console.log("decoded : " , decoded)
                    req.decoded = decoded;
                    next();
              })
        }



        // users
        app.get('/users' , async(req , res) => {
          const info = req.body;
          const result = await usersCollection.insertOne(info);
          res.send(result);
        })
        // products
        app.get('/allProducts' , async(req , res) => {
                const result = await allProductsCollection.find().toArray();
                // console.log("result vai all products" , result)
                res.send(result);
        })
        app.get('/especipicproduct/:id' , async(req, res) => {
                const id = req?.params?.id;
                // console.log("id" , id)
                const query = {_id : new ObjectId(id)};
                const result = await allProductsCollection.findOne(query);
                
                res.send(result);
        })

        // add to cart
        app.get("/carts" ,verifyToken ,  async(req , res) => {
          const email = req?.query?.email;
          console.log("email :  " , email);
          const query = {email : email}
            const carts = await addToCartCollection.find(query).toArray();
            // console.log(carts);
            res.send(carts);
        })
        app.post("/carts",verifyToken ,  async (req, res) => {
          const cartItem = req?.body;
          
          const result = await addToCartCollection .insertOne(cartItem);
          res.send(result);
        });
        app.delete('/addtocart' ,verifyToken ,  async(req , res) => {
            const id = req.query.id;
            const query = {_id : new ObjectId(id)};
            const result = await addToCartCollection.deleteOne(query);
            // console.log("delete", result);
            res.send(result);
        })
        // buy
        app.get("/buy/:id" ,verifyToken,  async(req ,res) => {
            const email = req.query.email;
            const id = req.params.id;
            console.log('email and id ' , email , id);

            const query = {_id : new ObjectId(id)};
            if(!id && !email){
              console.log("error")
                res.send( {message : 'can not find data'});
                return;
            }
            const result = await allProductsCollection.findOne(query);
            // console.log(result);
            res.send(result);
        })
        // confirm order
        app.post('/confirmorder' ,verifyToken, async(req , res) => {
            const info = req.body;
            const result = await confirmOrderCollection.insertOne(info);
            res.send(result);
        })

        // pagination
        // products count
        app.get('/productsCount' , async(req , res) => {
            const count = await allProductsCollection.estimatedDocumentCount();
            res.send({count})
        })
        app.get('/products' , async(req , res) => {
          const page = parseInt(req.query.page);
          const size = parseInt(req.query.size);

          const category = req.query.category;

          const query = {  category_name : category};
          
          if(query && query?.category_name !== 'allProducts'){

            const result = await allProductsCollection.find(query).skip(page * size).limit(size).toArray();
            // console.log("result vai category : " , result);
            
            res.send(result);
          }
          else if( query.category_name === 'allProducts'){
            const result = await allProductsCollection.find().skip(page * size).limit(size).toArray();
            // console.log("result vai all : " , result);
              
              res.send(result);
          }
               

        })





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);


app.get('/' , (req , res) => {
    console.log('The server is running')
})

app.listen(port , () => {
        console.log(`The server is running port on : ${port}`);
})