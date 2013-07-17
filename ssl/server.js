/**
https://github.com/ericvicenti/csr-gen  
 https://github.com/andris9/pem/blob/master/lib/pem.js
 http://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto
 http://stackoverflow.com/questions/8076834/nodejs-exec-with-binary-from-and-to-the-process
http://chschneider.eu/linux/server/openssl.shtml
 http://pages.cs.wisc.edu/~zmiller/ca-howto/
 http://blog.didierstevens.com/2008/12/30/howto-make-your-own-cert-with-openssl/
	   https://groups.google.com/forum/?fromgroups#!topic/nodejs/QD5cz01tfRI
	   http://docs.nodejitsu.com/articles/cryptography/how-to-use-the-tls-module
	   http://stackoverflow.com/questions/14383924/client-ssl-authorization-on-node-js
	   http://blog.james-carr.org/2010/07/26/using-an-ssl-certificate-to-make-a-secure-http-request-in-nodejs/
	   http://blog.nategood.com/nodejs-ssl-client-cert-auth-api-rest 
	   
	   http://stackoverflow.com/questions/4024393/difference-between-self-signed-ca-and-self-signed-certificate
	   
	   http://www.cnblogs.com/LevinJ/archive/2012/05/16/2503586.html
	   
	   http://bravenewmethod.wordpress.com/2010/12/09/apple-push-notifications-with-node-js/
��һ�����͵�TLSӦ���У�Client�˵�����ǲ���Ҫ��֤�ģ���һ��ͨ���������ʵ�֡�Server��������ɵ�������Certificate Authority���ṩ��Certificate��֤��TLSЭ�����ֵĲ������£��򻯰汾����
1)      ClientHello: Client��Server�˷���Hello��Ϣ���������֡�Hello��Ϣ�����Լ���֧�ֵ�SSL/TL�汾���ӽ����㷨��Key size.
2)      ServerHello: Server��ѡ��ƥ���SSL/TLS�汾���ӽ����㷨��������Щ��Ϣ���ظ�Client��
3)      Certificate: Server�˷����Լ���Certificate��Client��Certificate�а���Server��public key, domain name�ȡ�˳����һ�䣬public key��private key��һһ��Ӧ�ģ�����public key���ܵ���Ϣ���Ӹ�������˵��ֻ����private key���˲��ܽ��ܡ�
4)      Validate Server Identify: Client��CAͨ�ţ�ȷ��Certificate�е�public key�� domain name�ǺϷ���Ч�ġ�
5)      Exchange secrete key: Secret key exchange: client������һ��random��secret key, ����public key���ܡ�
6)      Exchange secrete key: Server����private key���ܱ����ܵ�secret key,����Client��Server��shareͬһ��secret key.
7)      ����ͬһ��secret key, Client ��Server�Ϳ��Լ��ܽ��ܽ�������������ϢͨѶ�ˣ������õļӽ����㷨Ϊ�Գ��Լӽ����㷨������AES, Blowfish, Camellia, SEED�ȣ���

	   
	   http://security.stackexchange.com/questions/27889/how-should-i-store-ssl-keys-on-the-server
	   You can use the "DHE" cipher suites for SSL. With these cipher suites, the server key is used for signatures,
	   not for encryption. This means that the attacker who steals your key can thereafter impersonate your server 
	   (i.e. run a fake server) but not decrypt SSL sessions which he previously recorded. This is a good property known as Perfect Forward Secrecy.
	   
	   https://gist.github.com/ExxKA/5169211
	   This architecture will allow you to have one web server communicating with an array of trusted clients, the web server itself can be on the public internet, that will not decrease the level of security, but it will only server trusted clients so it might aswell be on an internal network.
It is important you generate the CA yourself. The CA will control which client are authoried to connect to your application

Certificates

Create a Certificate Authority.
Create a server certificate and sign it.
Create a number of client certificates and sign all except one.


http://publib.boulder.ibm.com/infocenter/tivihelp/v5r1/index.jsp?topic=%2Fcom.ibm.itim.infocenter.doc%2Fcpt%2Fcpt_ic_security_ssl_authent2way.html

0��լ�С����У�����ء������ء���̿أ�����������geek����  http://gutspot.com/page/5/
http://gutspot.com/2012/08/09/tlsssl%E5%8F%8C%E5%90%91%E9%AA%8C%E8%AF%81/

http://publib.boulder.ibm.com/infocenter/tivihelp/v5r1/index.jsp?topic=%2Fcom.ibm.itim.infocenter.doc%2Fcpt%2Fcpt_ic_security_ssl_authent2way.html

TLS/SSL tunneling with Node.js   http://blog.shinetech.com/2011/07/04/tlsssl-tunneling-with-nodejs/

http://www.codeproject.com/Articles/326574/An-Introduction-to-Mutual-SSL-Authentication

http://blog.shinetech.com/2011/07/04/tlsssl-tunneling-with-nodejs/
http://looksgood.iteye.com/blog/1870239
http://stackoverflow.com/questions/10175812/how-to-build-a-self-signed-certificate-with-openssl

http://www.hacksparrow.com/express-js-https-server-client-example.html
http://www.hacksparrow.com/node-js-https-ssl-certificate.html

http://www.gettingcirrius.com/2012/06/securing-nodejs-and-express-with-ssl.html
**/
//http://stackoverflow.com/questions/14383924/client-ssl-authorization-on-node-js
//http://looksgood.iteye.com/blog/1870239
var express = require('express')
    , http = require('http')
    , path = require('path')
    , https = require('https')
    , fs = require('fs');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 8000);

    app.use(express.bodyParser());
    app.use(express.methodOverride());
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

/*
app.get('/', function(req, res) {
    console.log(req.client.authorized);
    res.send(req.client.authorized)
});
*/
app.all('/', function(req, res){  
    if (req.client.authorized) {  
        res.writeHead(200, {"Content-Type":"application/json"});  
        res.end('{"status":"authorized"}');  
        //        console.log(req.client);  
        console.log("Authorized Client ", req.client.socket.remoteAddress); 
        var subject = req.connection.getPeerCertificate().subject; 
        console.log('sbuject',subject);		
    } else {  
        res.writeHead(401, {"Content-Type":"application/json"});  
        res.end('{"status":"denied"}');  
        console.log("Denied Client " , req.client.socket.remoteAddress);  
    }  
});  

var options = {
    key:fs.readFileSync('server.key'),
    cert:fs.readFileSync('server.crt'),
    ca:[fs.readFileSync('ca.crt')],
    requestCert:true,
    rejectUnauthorized:true
   // ,agent: false
};

https.createServer(options,app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
});