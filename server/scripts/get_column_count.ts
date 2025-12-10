import pool from "../src/config/database";

const getPostsLength = async () =>{
    try{
        console.log("Attempting to get list...");

        const result = await pool.query('SELECT COUNT(id) FROM posts WHERE `status` = "published";');

        console.log("Query successful");
        console.log(result);
        console.log(result.rows[0]);
    }
    catch(err){
        console.error('Qery failed: ', err)
    }
    finally{
        process.exit();
    }
}

getPostsLength();