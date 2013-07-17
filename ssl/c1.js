/*
	   sensor network
	   http://host.comsoc.org/freetutorial/academic3/academic3.html
	   http://www.cs.ox.ac.uk/activities/sensors/index.htmlhttp://fiji.eecs.harvard.edu/Downloadshttp://opensense.epfl.ch/wiki/index.php/Main_Page
	   
	   
	   

	   
	   
	   http://build-a-product.quora.com/Day-195-196-Kiiy-The-Robotic-Friend-Brain-Body-Engineering
	   http://hernan.amiune.com/blog/entry/phd-vs-startup
	   http://securitywatch.pcmag.com/hacking/311869-how-to-hack-twitter-s-two-factor-authentication
	   http://asserttrue.blogspot.hu/search?updated-max=2013-05-15T00:30:00-04:00
	   http://blog.aetherworks.com/2013/05/phd-to-startup/
	   
	   http://www.dashingd3js.com/data-visualization-and-d3-newsletter/data-visualization-and-d3-newsletter-issue-9
	   http://cdn.oreillystatic.com/en/assets/1/event/91/Real-time%20Stream%20Processing%20and%20Visualization%20Using%20Kafka,%20Storm,%20and%20d3_js%20Presentation.pdf
	   https://github.com/mikedewar/d3talk
	   https://github.com/mikedewar/getting_started_with_d3
	   http://tributary.io/inlet/4242043/
	   http://www.jansipke.nl/creating-network-diagrams-with-d3-js/
	   
*/

var tls = require('tls');  
    var fs = require('fs');  
  
    var options = {  
        // These are necessary only if using the client certificate authentication  
        //key: fs.readFileSync('client-key.pem'),  
        //cert: fs.readFileSync('client-cert.pem'),  
        key: fs.readFileSync('client.key'),
		cert: fs.readFileSync('client.crt'),
        rejectUnauthorized: true,  
        // This is necessary only if the server uses the self-signed certificate  
        ca: [ fs.readFileSync('ca.crt') ]  
        };  
  
    var cleartextStream = tls.connect(8000, 'localhost', options, function() {  
        console.log('client connected',  
            cleartextStream.authorized ? 'authorized' : 'unauthorized');  
        cleartextStream.setEncoding('utf8');  
        if(!cleartextStream.authorized){  
        console.log('cert auth error: ', cleartextStream.authorizationError);  
        }  
    //    console.log(cleartextStream.getPeerCertificate());  
    });  
    cleartextStream.setEncoding('utf8');  
    cleartextStream.on('data', function(data) {  
        console.log(data);
		
		/////////////////   create a client csr
        var pem = require('pem'); 
        pem.createCSR({'commonName':'xsz'},function(err,data){
             console.log(data.clientKey,"\n\n",data.csr);
             //cleartextStream.write('Hello,this message is come from client!'); 
             cleartextStream.write(data.csr);			 
             cleartextStream.end();    
        })
		/////////////////
		
		
    });  
    cleartextStream.on('end', function() {  
        console.log('disconnected');  
    });  
    cleartextStream.on('error', function(exception) {  
        console.log(exception);  
});


 
/*
http://www.intechopen.com/books/magnetic-sensors-principles-and-applications
http://www.intechopen.com/books/intelligent-systems/provably-correct-intelligent-elearning-environment
http://www.intechopen.com/books/novel-applications-of-the-uwb-technologies
http://www.intechopen.com/books/wireless-sensor-networks
http://www.intechopen.com/books/emerging-communications-for-wireless-sensor-networks
http://www.intechopen.com/books/smart-wireless-sensor-networks
http://www.intechopen.com/books/sustainable-wireless-sensor-networks
http://www.intechopen.com/books/wireless-sensor-networks-application-centric-design
http://www.intechopen.com/books/ultra-wideband-radio-technologies-for-communications-localization-and-sensor-applications
http://www.intechopen.com/books/acoustic-emission-research-and-applications
http://www.intechopen.com/books/advancement-in-microstrip-antennas-with-recent-applications
http://www.intechopen.com/books/small-scale-energy-harvesting
http://www.intechopen.com/books/wireless-sensor-networks-technology-and-protocols
http://www.intechopen.com/books/wireless-mesh-networks-efficient-link-scheduling-channel-assignment-and-network-planning-strategies
http://www.intechopen.com/books/wireless-sensor-networks-technology-and-applications
*/