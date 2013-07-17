//http://looksgood.iteye.com/blog/1870239
//http://stackoverflow.com/questions/14383924/client-ssl-authorization-on-node-js
var tls = require('tls');  
    var fs = require('fs');  
require('colors');
  
var ca_key = fs.readFileSync('ca.key');
var ca_crt =   fs.readFileSync('ca.crt');

    var options = {  
    key:fs.readFileSync('server.key'),
    cert:fs.readFileSync('server.crt'),
    ca:[ca_crt], 
        requestCert: true,   
        rejectUnauthorized: true 
    };  
  
    var server = tls.createServer(options, function(cleartextStream) { 
	/*
		var peer_cert = cleartextStream.connection.getPeerCertificate();
        if (peer_cert.valid_to) {
          peer_cert.valid_to = Date.parse(peer_cert.valid_to);
          peer_cert.valid_from = Date.parse(peer_cert.valid_from);
        }	
		console.log(peer_cert);
    */
	
        console.log('server connected',   cleartextStream.authorized ? 'authorized' : 'unauthorized');           
        cleartextStream.write('this message is come from server!');  
        cleartextStream.setEncoding('utf8');  
        cleartextStream.pipe(cleartextStream);  
		


  
        cleartextStream.on('data', function(csr) {  
           console.log(csr);  
           console.log(ca_key.toString());
		   console.log(ca_crt.toString());
////////////////// receive csr and sign the client csr with ca's crt and ca's key		   
           var pem = require('pem'); 
           pem.createCertificate({'serviceKey':ca_key.toString(),'serviceCertificate':ca_crt.toString(),'days':365,'csr':csr,'serial':'abcadfd'},function(err,data){
               if(err) console.log(err);
               else console.log("\n\n client signed certificate".green,data.certificate);
            });		
		
		});  
});  

server.listen(8000, function() {  
        console.log('server bound');  
});

/*
app.get('/', function(req, res){

  // AUTHORIZED 
  if(req.client.authorized){

    var subject = req.connection.getPeerCertificate().subject;    
    res.send('authorized', 
      { title:        'Authorized!',
     user:         subject.CN,
     email:        subject.emailAddress,
     organization: subject.O,
     unit:         subject.OU,
     location:     subject.L,
     state:        subject.ST,
     country:      subject.C
   }); 
 
  // NOT AUTHORIZED
  } else {
   res.send('unauthorized', { title: 'Unauthorized!' }); 
  }
});
*/