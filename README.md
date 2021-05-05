# CloudflarePlesk-Link
This is a refresh of a plesk extension i used for a while but found didnt work for acme txt records so here is my version that will eventually do all the things the previous one did.

### Installation
Its real simple you can run it from anywhere nodejs will run and install as well as has internet access(obviously)
Theres a few Environment variables to set before you can use it though they are listed below

This you can get from running a quick command see below or check documentation
`curl -X POST "https://<plesk-url>/api/v2/auth/keys" -H "accept: application/json" -H "Content-Type: application/json" -d "{ \"ip\": \"<ip you want to access from>\", \"login\": \"admin\", \"password\": \"<password>\" \"description\": \"Secret key for Administrator\"}"`

`PLESKKEY=`

Cloudflare stuff is pretty easy just add your global/key with permissions to change and view dns records, the email you use for Cloudflare and your AccountID google these if you need to know

`CLOUDKEY=`

`CLOUDEMAIL=`

`CLOUDACCOUNTID=`

Plesk URL is your url that you access your plesk panel from, this can also be an ip if needed and may need the port 8443, i didnt have to but i also didnt set my plesk server up like a plebian

`PLESKURL=`

These last four are for sending an email to you when you are done (it takes about 30-60 seconds to do all the api calls) the email will contain a summary of the domains changed and the domains where the bot just sat around punching sand. email is your email you want to recieve the email, sender is the sender this can be the same as the reciever because email cool. spass is sender password and finally host is your mail host, this used port 465 by default so you will need a secure mail server to use it.

`EMAIL=`

`SENDER=`

`SPASS=`

`HOST=`



### random notes
the last api call where it actually pushes the acme-challenge dns record will only be called if the keys dont match, this just makes it a little faster for subsequent runs. 
This was not meant to be a fast bot it is intended to be run in the wee hours of the night while everyones asleep by a cron job, to do this go to your terminal and smack in `crontab -e` and set it to the cron time you want it to run at google these i dont know them off by heart to be able to tell you. and then end it off with `node index.js` pointed at your cloned index.js make sure you have a .env file configured in there though it will just break and flop around if you dont.

#Good luck
