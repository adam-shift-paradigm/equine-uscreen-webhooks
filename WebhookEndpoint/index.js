// Import the tedious library
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;

// Entry point of the function
module.exports = function (context, req) {
    try {

        //context.log('JavaScript HTTP trigger function processed a request. %s', new Date().toISOString());
// Check if event value passed in request
        if ('event' in req.body === false) {
            throw 'Event type not passed';
        }

// Log incoming request        
        context.log(req.body);

        let requestBody = {};
// get Equine Publication as part of the route        
        requestBody['publication'] = context.bindingData.publication;
// set default request values        
        requestBody['source'] = 'webhook';
        requestBody['event'] = req.body.event;
        requestBody['user_id'] = null;
        requestBody['video_id'] = null;
        requestBody['custom_fields'] = null;
        requestBody['offer_id'] = null;
        requestBody['invoice_id'] = null;
        requestBody['total'] = null;
        requestBody['amount'] = null;
        requestBody['discount'] = null;
        requestBody['order_id'] = null;

// populate requestBody object based on event type
        eventMonitored = true;
        switch(requestBody.event) {
            case 'user_created':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['custom_fields'] = JSON.stringify(req.body.custom_fields);               
                break;
            case 'user_signed_in':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                break;
            case 'payment_method_updated':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                break;    
            case 'ownership_created':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['offer_id'] = req.body.offer_id;
                requestBody['custom_fields'] = req.body.offer_title;
                break;  
            case 'user_updated':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = null;
                requestBody['fullname'] = null;
                requestBody['custom_fields'] = JSON.stringify(req.body.changes);               
                break;                                          
            case 'video_play':
                requestBody['video_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['custom_fields'] = req.body.title;
                break; 
            case 'added_to_favorites':
                requestBody['video_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['custom_fields'] = req.body.title;
                break;
                
            case 'subscription_canceled':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['offer_id'] = req.body.offer_id;
                requestBody['custom_fields'] = req.body.offer_title;
                break;  

            case 'order_paid':
                requestBody['order_id'] = req.body.id;
                requestBody['email'] = req.body.customer_email;
                requestBody['fullname'] = req.body.customer_name;
                requestBody['offer_id'] = req.body.offer_id;
                requestBody['total'] = req.body.total;
                requestBody['amount'] = req.body.amount;
                requestBody['discount'] = req.body.discount;
                break; 

            case 'success_recurring':
                requestBody['user_id'] = req.body.id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['offer_id'] = req.body.offer_id;
                requestBody['custom_fields'] = req.body.offer_title;
                break;  

            case 'invoice_overdue':
                requestBody['user_id'] = req.body.user_id;
                requestBody['email'] = req.body.email;
                requestBody['fullname'] = req.body.name;
                requestBody['offer_id'] = req.body.offer_id;
                requestBody['custom_fields'] = req.body.title;
                requestBody['total'] = req.body.final_price;
                requestBody['invoice_id'] = req.body.invoice_id;
                break; 

            default:
                eventMonitored = false;
        } 

    // Define variables to store connection details and credentials
    // Connection details and credentials are fetched from Environment Variables during function execution
        const config = {
            server: process.env["AZURESQL_SERVER_FQDN"],
            authentication: {
                type: 'default',
                options: {
                    userName: process.env["AZURESQL_USER"],
                    password: process.env["AZURESQL_USER_PASSWORD"],
                }
            },
            options: {
                encrypt: true,
                database: process.env["AZURESQL_DATABASE"],
                port: 1433
            }
        };      
        
// Create Connection object
        const connection = new Connection(config);        

// Create query to execute against the database
        const queryText = `INSERT INTO UScreen__Events (source, publication, event, email, fullname, user_id, video_id, custom_fields, offer_id, invoice_id, total, amount, discount, order_id) 
            VALUES (@source, @publication, @event, @email, @fullname, @user_id, @video_id, @custom_fields, @offer_id, @invoice_id, @total, @amount, @discount, @order_id)`;
       
// Create Request object
        const request = new Request(queryText, function(err) {
            if (err) {
                // Error in executing query
                context.log.error(err);
                context.res.status = 500;
                context.res.body = "Error executing the query";
            } else {
                context.res = {
                    status: 200,
                    isRaw: true,
                    //body: result,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            }
            context.done();
        });  

        connection.on('connect', function(err) {
            if (err) {
                // Error in connecting
                context.log.error(err);
                context.res.status = 500;
                context.res.body = "Unable to establish a connection.";                
                context.done();                

            } else {

  // Setting values to the variables. Note: first argument matches name of variable above.
                request.addParameter('source', TYPES.VarChar, requestBody['source']);
                request.addParameter('publication', TYPES.VarChar, requestBody['publication']);
                request.addParameter('event', TYPES.VarChar, requestBody['event']);     
                request.addParameter('email', TYPES.VarChar, requestBody['email']);             
                request.addParameter('fullname', TYPES.VarChar, requestBody['fullname']);             
                request.addParameter('user_id', TYPES.Int, requestBody['user_id']);
                request.addParameter('video_id', TYPES.Int, requestBody['video_id']);
                request.addParameter('custom_fields', TYPES.VarChar, requestBody['custom_fields']);             
                request.addParameter('offer_id', TYPES.Int, requestBody['offer_id']);                
                request.addParameter('invoice_id', TYPES.Int, requestBody['invoice_id']);             
                request.addParameter('total', TYPES.VarChar, requestBody['total']);             
                request.addParameter('amount', TYPES.VarChar, requestBody['amount']);             
                request.addParameter('discount', TYPES.VarChar, requestBody['discount']);             
                request.addParameter('order_id', TYPES.Int, requestBody['order_id']);             
                
                // Connection succeeded
                connection.execSql(request);
            }
        });

// Connect
        connection.connect();

    } catch(err) {

        context.log.error(err);
        context.res.status = 500;
        context.res.body = "Error executing the query";
        context.done();
    }
   
}
