const fetch = require('node-fetch');
const dotenv = require('dotenv')
const nodemailer = require('nodemailer')
dotenv.config();


let transporter = nodemailer.createTransport({
  host: process.env.HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SENDER, // generated ethereal user
      pass: process.env.SPASS, // generated ethereal password
    },
})
let message = [];
async function grabdomainnames(){
  let domains = [];
  await fetch('https://'+process.env.PLESKURL+'/api/v2/domains', {
      method:"GET",
      headers: {
          'X-API-Key': process.env.PLESKKEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
  }).then(response => response.json())
    .then(data => {
      for(i in data){
        domains.push(data[i].name)
      }

    });
    return domains
}
let domainInfo = []
async function grabCloudflaredomains(){
  let domains = [];
  await fetch('https://api.cloudflare.com/client/v4/zones?match=all&account.id='+process.env.CLOUDACCOUNTID, {
      method: 'GET',
      headers: {
          'X-Auth-Email': process.env.CLOUDEMAIL,
          'X-Auth-Key': process.env.CLOUDKEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
    })
    .then(response => response.json())
    .then(async data => {
      for(i in data.result){
        domainInfo.push(data.result[i])
        domains.push(data.result[i].name)
      }

      if(data.result_info.total_pages > 1){
        let count = 1
        while(count < data.result_info.total_pages){
          count = count+1
          await fetch('https://api.cloudflare.com/client/v4/zones?match=all&account.id='+process.env.CLOUDACCOUNTID+'&page='+count, {
              method: 'GET',
              headers: {
                  'X-Auth-Email': process.env.CLOUDEMAIL,
                  'X-Auth-Key': process.env.CLOUDKEY,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
            })
            .then(response => response.json())
            .then(data => {
              for(i in data.result){
                domainInfo.push(data.result[i])
                domains.push(data.result[i].name)
              }

            })

        }

      }
    });
    return domains

}


async function filterDomains(){
  let cloudflare = await grabCloudflaredomains();
  let plesk = await grabdomainnames();
  let result = await cloudflare.filter( ( el ) => plesk.includes( el ) );
  return result

}







async function dns(){
  let domains = await filterDomains()
  let records = []
  for(i in domains){
    let res = await fetch('https://'+process.env.PLESKURL+'/api/v2/cli/dns/call', {
        method: 'POST',
        headers: {
            'X-API-Key': process.env.PLESKKEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ "params": [ "--info", domains[i]]})
    })
      .then(response => response.json())
      .then(data => {
        let string = data.stdout.split("\n")
        let acme = "_acme-challenge"
        length = acme.length;
        for(i in string){
          if (string[i].indexOf(acme)!=-1) {
           // one of the substrings is in yourstring
           records.push(string[i]) //result
          }
        }
        });
      }
      let finalarray = []
      for(i in records){
        finalarray.push(records[i].split(' '))
      }
      return finalarray
}

async function mergedns(){
  let finalarray = await dns()
  for(i in finalarray){
    for(x in domainInfo){
      if(finalarray[i][0].includes(domainInfo[x].name)){
        finalarray[i].push(domainInfo[x].id);
        finalarray[i].push(domainInfo[x].name)
      }
    }
  }
  for(i in finalarray){
    let zone = finalarray[i][4];

    await fetch('https://api.cloudflare.com/client/v4/zones/'+zone+'/dns_records?type=TXT&name=_acme-challenge.'+finalarray[i][5], {
        method: 'GET',
        headers: {
            'X-Auth-Email': process.env.CLOUDEMAIL,
            'X-Auth-Key': process.env.CLOUDKEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },

      })
      .then(response => response.json())
      .then(data => {
        if(data.result[0] == undefined){
          finalarray[i].push("create")
        }else{
          finalarray[i].push(data.result[0].id)
          finalarray[i].push(data.result[0].content)
        }
      })
  }
  return finalarray
}
senddns()
async function senddns(){
  let finalarray = await mergedns()

  for(i in finalarray){
    if(finalarray[i][6] == 'create'){
      fetch("https://api.cloudflare.com/client/v4/zones/"+finalarray[i][4]+"/dns_records", {
        body: JSON.stringify({type:finalarray[i][1], name:finalarray[i][0], content:finalarray[i][3], ttl:1}),
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": process.env.CLOUDEMAIL,
          "X-Auth-Key": process.env.CLOUDKEY,
        },
        method: "POST"
      })
    } else if(finalarray[i][3] ==finalarray[i][7]){
      message.push("punching sand for this turn")
      console.log("punching sand for this turn")
    }else{
      await fetch('https://api.cloudflare.com/client/v4/zones/'+finalarray[i][4]+'/dns_records/'+finalarray[i][6], {
          method: 'PUT',
          headers: {
              'X-Auth-Email': process.env.CLOUDEMAIL,
              'X-Auth-Key': process.env.CLOUDKEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({type:finalarray[i][1], name:finalarray[i][0], content:finalarray[i][3], ttl:1}),
        })
        .then(response => response.json())
        .then(data => {
          message.push(data)
          console.log(data)
        })
    }

  }
  message.push(finalarray)
  console.log(finalarray)
  mail()
}
async function mail(){
  let info = await transporter.sendMail({
    from: '"DNSBOT" <'+process.env.SENDER+'>',
    to: process.env.EMAIL,
    subject: "DNS updates "+ new Date,
    text: message.toString().replaceAll(',', "\n"),
  })
  console.log(info)
  console.log("Message sent to "+process.env.EMAIL)
}
