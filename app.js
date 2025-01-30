const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());

const mongoURL ="mongodb+srv://srigeethani:srigeethani@cluster0.hcv6mqf.mongodb.net/JobMarketplace";
mongoose
    .connect(mongoURL)
    .then(() => {
        console.log("Connected to database");
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to database", err);
    });


const jobSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    budget: { type: Number, required: true },
    status: { type: String, default: "Pending" }, 
    postedBy: { type: String, required: true }, 
});

const JobModel = mongoose.model("job", jobSchema);

// Fetch all open jobs (for freelancers)
app.get("/api/jobs/open", async (req, res) => {
    try {
        const jobs = await JobModel.find({ status: "Pending" });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch open jobs" });
    }
});

// Fetch all jobs posted by a specific user (for job posters)
app.get("/api/jobs/posted/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const jobs = await JobModel.find({ postedBy: userId });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posted jobs" });
    }
});


 app.post("/api/jobs", async (req, res) => {
     const { title, category, budget, postedBy } = req.body;

     const newJob = new JobModel({
         id: new mongoose.Types.ObjectId(),
         title,
         category,
         budget,
         postedBy,
     });

     try {
         const savedJob = await newJob.save();
            console.log("Job Saved: ", savedJob);  // Log the saved job object  
         res.status(200).json(savedJob);
     } catch (error) {
         res.status(500).json({ error: "Failed to add job" });
     }
});


app.put("/api/jobs/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedJob = await JobModel.findOneAndUpdate({ id }, { status }, { new: true });
        if (!updatedJob) {
            return res.status(404).json({ error: "Job not found" });
        }
        res.status(200).json(updatedJob);
    } catch (error) {
        res.status(500).json({ error: "Failed to update job" });
    }
});


app.delete("/api/jobs/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deletedJob = await JobModel.findOneAndDelete({ id });
        if (!deletedJob) {
            return res.status(404).json({ error: "Job not found" });
        }
        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete job" });
    }
});


const userSchema=new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true}
});
const user=mongoose.model("user",userSchema);

app.post("/api/register",async(req,res)=>{
    const {username,password}=req.body;
    const hashedPassword=await bcrypt.hash(password,10);
    const newUser=new user({
        username,
        password:hashedPassword
    });
    const savedUser=await newUser.save();
    res.status(200).json({message:"User registered successfully",user:savedUser});
});


app.post("/api/login",async(req,res)=>{
    const {username,password}=req.body;
    const userData  =await user.findOne({username});


    const isPasswordValid=bcrypt.compare(password,userData.password);
    if(!isPasswordValid){
        return res.status(401).json({message:"Invalid username or password"});
    }

    const token=jwt.sign({username:userData.username},"mykey");
    res.status(200).json({message:"User logged in successfully",token});
    });

    const authorize=(req,res,next)=>{
        const token=req.headers["authorization"]?.split(" ")[1];
        console.log({token});
        if(!token)
        {
            return res.status(401).json({message:"No token provided"});
        }
        jwt.verify(token,"mykey",(error,userInfo)=>{
            if(error)
            {
                return res.status(401).json({message:"Unauthorized"});
            }
            req.user=userInfo;
            next();
        });
    }
    
    app.get("/api/secured",authorize,(req,res)=>{
        res.json({message:"Access granted",user:req.user});
    });

  











