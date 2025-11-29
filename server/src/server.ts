import dotenv from 'dotenv'
import express, { Request, Response, NextFunction, ErrorRequestHandler, Errback } from 'express';
import { json } from 'body-parser';


interface User {
    id: number,
    username: string,
    email: string;
}

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

interface Person {
    id : number,
    username: string,
    email: string
};

const users : User[] = [
    {  id: 1, username: "user1", email: "user1@gmail.com" },
    {  id: 2, username: "user2", email: "user2@gmail.com" },
    {  id: 3, username: "user3", email: "user3@gmail.com" },
    {  id: 4, username: "user4", email: "user4@gmail.com" },
    {  id: 5, username: "user5", email: "user5@gmail.com" },
    {  id: 6, username: "user6", email: "user6@gmail.com" },
];

app.get('/api/users', (req : Request, res : Response) =>{
    res.json(users);
})

app.get('/api/users/:id', (req : Request, res : Response) =>{
    const id : number = parseInt(req.params.id);
    try{
        const getuser : Person | undefined = users.find((user) => user.id === id);
        if(getuser == undefined){
            res.status(500).json("No user found");
        }
        res.status(200).json(getuser);
    }
    catch(err){
        res.status(500).json({ msg: err })
    }
})

//Create a new user
app.post("/api/users/add", (req : Request, res: Response) =>{
    const username : string = req.body.username;
    const email : string = req.body.email;

    try{
        if(!username || !email){
            res.status(400).json("An Id, username and email is required!");
        }
        const newPerson : Person = {
            id: users.length + 1,
            username,
            email
        }

        const addnewPerson = users.push(newPerson);

        res.status(201).json({addnewPerson, newPerson});
    }
    catch(err){
        res.status(500).json(err);
    }
})


app.listen(PORT, () =>{
    console.log("Server is running!");
}); 