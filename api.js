var express=require('express');
var app=express();
var body=require('body-parser')
var path=require('path')
var blockchain=require('./blockchain');
var bitcoin=new blockchain()
app.use(body.json());
app.use(body.urlencoded({extended:true}))
app.get('/home',(req,res)=>{
    res.sendFile(path.join(__dirname,'html','trans.html'))
})
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'html','index.html'))
})
app.get('/network',(req,res)=>{
    res.sendFile(path.join(__dirname,'html','network.html'))
})
app.post('/transaction',(req,res)=>{
    bitcoin.createtransactions(req.body.from,req.body.to,req.body.amt);
   return true
})
app.get('/blockchain',(req,res)=>{
    res.send(bitcoin);
})
app.get('/mine-broadcast',(req,res)=>{
    var pbh=bitcoin.lastblock()['hash'];
    
    var cbd={
        transaction:bitcoin.pendingtransactions,
        index:bitcoin.lastblock()['index']+1
    }
    var cbh=bitcoin.pow(pbh,cbd)
    bitcoin.createnewblock(cbh['nounce'],pbh,cbh['hash'])
    const broadcast=[]
    bitcoin.networknode.forEach((nodesurl)=>{
        const mineopt={
            url:nodesurl+'/recieve-mine',
            method:'GET',
            body:{currentblockhash:cbh['hash'],prevblockhash:pbh,nounce:cbh['nounce']},
            json:true
        }
       rp(mineopt)
        
    })
    Promise.all(broadcast).then((data)=>{
        console.log('brodcasted mining')
        res.redirect('/blockchain')
    }).catch(err=>{

    });

    
;})
app.get('/recieve-mine',(req,res)=>{
    bitcoin.createnewblock(req.body.nounce,req.body.prevblockhash,req.body.currentblockhash)
    
})
var rp = require('request-promise');
app.post('/register-and-broadcast', (req,res)=>{
    const requestedurl=req.body.requestedurl;
    const broadcast=[]
    
    var flag=0;
     bitcoin.networknode.forEach( (networknodesurl)=>{// making ready all th networks to register it
        flag=1;
         const requestoptions={
             url:networknodesurl+'/registerinthenetwork',
             method:'POST',
             body:{requestedurl:requestedurl},
             json:true
         }
          rp(requestoptions)
        
     })
    
     if((bitcoin.networknode.indexOf(requestedurl)==-1) &&(bitcoin.cu!=requestedurl)){
        bitcoin.networknode.push(requestedurl)
    
    }
     
     Promise.all(broadcast)
     .then((data)=>{//if all promises are resolved it would exeute
         // make the requested nod to register all the nodes in the network
         console.log('enteres')
         const requestedregisteroption={
             url:requestedurl+'/registernetwork',
             method:'POST',
             body:{networknodesurl:[ ...bitcoin.networknode,bitcoin.cu]},
             json:true
         }
         rp(requestedregisteroption)
        console.log('given to all nodes');
         res.redirect('/network');
     }).catch(err=>{
 console.log('notttt')
     });
     

})
app.post('/registerinthenetwork',(req,res)=>{
           var requestedurl=req.body.requestedurl;
           if((bitcoin.networknode.indexOf(requestedurl)==-1) &&(bitcoin.cu!=requestedurl)){
            bitcoin.networknode.push(requestedurl)
            console.log('pushed requested node to the network')
            }

     
});
app.post('/registernetwork',(req,res)=>{
      var networknodesurls=req.body.networknodesurl;
      console.log('enters');
      networknodesurls.forEach(urls=>{
        if((bitcoin.networknode.indexOf(urls)==-1) &&(bitcoin.cu!=urls)){
              console.log(urls)
              bitcoin.networknode.push(urls);
          }
      })
      console.log('pushed network')
    
});
app.post('/broadcast/transaction',(req,res)=>{
    bitcoin.createtransactions(req.body.from,req.body.to,req.body.amt);
    const broadcast=[]
    bitcoin.networknode.forEach(async (nodesurl)=>{
        const tranopt={
            url:nodesurl+'/transaction',
            method:'POST',
            body:req.body,
            json:true
        }
        var result=await rp(tranopt)
        broadcast.push(result);
    })
    Promise.all(broadcast).then((data)=>{
        console.log('brodcasted tranasctions')
        res.redirect('/blockchain')
    }).catch(err=>{

    });
})
app.get('/consensus',(req,res)=>{
    var getdetails=[]
    bitcoin.networknode.forEach((nodes)=>{
        var getbcoptions={
            url:nodes+'/blockchain',
            method:'GET',
            json:true
        }
    getdetails.push(rp(getbcoptions))

    })
    Promise.all(getdetails).then((blockchaindetails)=>{
        var maxlength=bitcoin.chain.length;
        var newmax=null;
        var pending=null;
        blockchaindetails.forEach(blocknode=>{
            if(blocknode.chain.length>maxlength){
                maxlength=blocknode.chain.length;
                newmax=blocknode.chain;
                pending=blocknode.pendingtransactions;
            }
        })
        
        if(newmax&&bitcoin.chainisvalid(newmax)){
            bitcoin.chain=newmax;
            bitcoin.pendingtransactions=pending;
            res.redirect('/blockchain')
        }
        else
        {
            console.log('something went wrong')
        }

    }).catch()
})
app.get('/block/:blockhash',(req,res)=>{
    var result=bitcoin.getblock((req.params.blockhash).toString());
    
        res.json({block:result})
    
    
})
app.get('/tran/:transid',(req,res)=>{
    var result=bitcoin.gettransaction((req.params.transid).toString());
    
        res.json({block:result})
    
    
})
app.get('/member/:member',(req,res)=>{
    var result=bitcoin.profiledetails((req.params.member).toString());
    
        res.json({block:result})
    
    
})
var port=process.argv[2];
const server=app.listen(port,()=>{
    console.log(`listening to `,port)
})