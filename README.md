# Sample genie | nodeJS
Get more info about how to create genies for Blend Messenger at [developers.blend.la](https://developers.blend.la)

This repo contains a basic genie with nodeJS and [express](http://expressjs.com).

When added to a group this genie will send a simple welcome message and then will continue to welcome new people when members are added within the groups the genie is added.

Bellow you'll find a quick tutorial on how to get this Genie up and running on a new VPS.
Please keep in mind that this tutorial is tailored for **CentOS 7.2 x64**.

You can obvisouly host the genie anywhere but if you need a fast VPS machine that you can get up and running in no time our recommandation would be DigitalOcean.com (use DO10 at registration to get some free credit) or Amazon AWS.

For develoment purposes for this genie you will not need more than 512MB/1GB RAM and one CPU core will do just fine.

## Requirements
1. CentOS 7.2 x64 server
2. A public hostname that you are going to use for the genie (domain or subdomain) - you can also use a no-ip service if you don't have access to a domain you can administer DNS for.
3. HTTPS certificate (letsencrypt.org free https should also work)

## Installation

### Server, subdomain set-up
Create your new VPS and use CentOS 7.2 x64 as the linux distribution.

Once you have the public IP for your server point your domain or subdomain to this ip with an A DNS entry.

If you don't have access to DNS for your domain you can just use a no-ip service (such as noip.com to get a free subdomain to point to your vps public ip address)


### Server installation

Log-in to your new server, ideally using the subdomain address to test if the DNS is working properly.

Once you're in you will have to install a few things.

#### 1. Epel-release
Let's install epel-release repo which contains some of the packages that we are going to use later on:
```bash
yum install epel-release -y
```

#### 2. Packages we need
Now let's install haproxy (a reverse-proxy that we are going to use for HTTPS termination, nodeJS and git so we can clone this repo)

```bash
yum install haproxy nodejs git -y
```

#### 3. HTTPS certificate and haproxy
Now let's get a HTTPS certificate in case we don't have one. We are going to use letsencrypt.org. If you already have a HTTPS certificate you can skip this step.

```bash
yum install certbot -y
```

Once installed we can use certbot to issue an certificate for the domain.

```bash
certbot certonly
```

The tool has a visual UI so when asked about authenticating with the ACME CA select **2. automaticaly use a temporary webserver (standalone)**

We are going to use haproxy to serve the content over https so we need to configure it.

Replace /etc/haproxy/haproxy.cfg with this configuration:

```
global

tune.ssl.default-dh-param 2048
ssl-default-bind-options no-sslv3 no-tls-tickets
ssl-default-bind-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA

ssl-default-server-options no-sslv3 no-tls-tickets
ssl-default-server-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA

log         127.0.0.1 local2

chroot      /var/lib/haproxy
pidfile     /var/run/haproxy.pid
maxconn     2048
user        haproxy
group       haproxy
daemon

stats socket /var/lib/haproxy/stats

defaults
mode                    http
log                     global
option                  httplog
option                  dontlognull
option forwardfor       except 127.0.0.0/8
option                  redispatch
option http-keep-alive
retries                 3
timeout queue           60s
timeout connect         15s
timeout client          120s
timeout server          60s
timeout http-keep-alive 60s
timeout check           10s
maxconn                 300


frontend www-http
bind *:80
reqadd X-Forwarded-Proto:\ http
default_backend www-backend
rspadd Strict-Transport-Security:\ max-age=31536000;\ includeSubDomains

frontend www-https
bind *:443 ssl crt /etc/ssl/certs/haproxy.pem no-sslv3
reqadd X-Forwarded-Proto:\ https
default_backend www-backend

rspadd Strict-Transport-Security:\ max-age=31536000;\ includeSubDomains


backend www-backend
redirect scheme https if !{ ssl_fc }
balance roundrobin
server self 127.0.0.1:3000 check inter 2500
```

**After you've saved the new HAPROXY configuration we will also need to configure the HTTPS cert for use within HAPROXY**

!! Please make sure to replace your-domain.com with your own domain within the command below before executing.

```bash
cat /etc/letsencrypt/live/your-domain.com/privkey.pem > /etc/ssl/certs/haproxy.pem && cat /etc/letsencrypt/live/your-domain.com/fullchain.pem >> /etc/ssl/certs/haproxy.pem
```

HAPROXY is now configured and ready so let's enable the service and start it.

```bash
systemctl enable haproxy && systemctl start haproxy
```

#### 4. Configure firewall

```bash
systemctl restart firewalld && firewall-cmd --permanent --add-port=443/tcp && firewall-cmd --reload
```

#### 5. Install the Genie/nodejs project

Clone and install the project within a new root folder /apps/genie.sample.nodejs
```
mkdir /apps && cd /apps && git clone https://github.com/blendsystems/genie.sample.nodejs.git && cd genie.sample.nodejs && npm install
```

#### 6. Configure genie
Once installed we need to configure it so we can bring it online.

You can copy the config.js.sample to config.js and add the required configuration.

Your *config.js* file should look like this:

```javascript
module.exports = {
        //This genie application url (please keep in mind it needs https)
        url: 'https://yourdomain.com',
        //blend Genie api access info
        api: {
                accessKey: 'YourAccessKey',
                accessSecret: 'YourAccessSecret',
        },
}
```

Replace and add the required info before saving the config file.

#### 6. Running the genie
You can start the genie by issuing ``` npm start ``` within the root folder of the genie. The default HTTP PORT is 3000 and HAPROXY will connect to this port to expose the HTTPS connection.

We recommend using a process manager as it's easier to start and monitor the service. [pm2](http://pm2.keymetrics.io) is a decent process manager that can fit this purpose.

You can install pm2 with npm: ``` npm install pm2 -g ```

Once pm2 is installed you can start the genie within pm2 with ``` pm2 start bin/www```

To see status of the service you can use pm2: ``` pm2 status ```. You can also easily start/restart or stop the service using ``` pm2 start/stop/restart www```

To see real-time logs of the genie you can use ``` pm2 logs www ```

#### 7. Final step - register payload & register webhook for api events
##### Register to receive events from Blend api
In order to actually use the genie within the Blend messenger you will need to first register the event handler by using the registerEventSubscription.js script within the root directory of the project. ``` node registerEventSubscription.js ``` 

Try to have the ```pm2 logs www``` open in another terminal to see real time events and to see when the subscription status changes.

##### Register a payload
You also need to register your payload in order for you to be able to play with the genie within the app.
The *registerPayload.js* contains and registers a sample payload with the api. This should get you going. Once you run ``` node registerPayload.js``` you should be good to go.

##### Adding your new genie to a group on Blend
Your genie is not visible in the app just yet but you can add it to any group you're in by typing ```/addgenie genieidentifier``` within the mobile clients.

Have fun!