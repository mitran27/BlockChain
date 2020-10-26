var sha=require('sha256')
var uuid=require('uuid/v1')
const currenturl=process.argv[3];
function blockchain(){
    this.chain=[];
    this.pendingtransactions=[];
    this.createnewblock(100,'0','0');
    this.cu=currenturl;
    this.networknode=[]
};
blockchain.prototype.createnewblock=function(nounce,prevblockhash,hash){
    var f=this.chain
    const newblock={//structure of th block in the block chain
        index: f.length+1,
        timestamp:Date.now(),
        transaction:this.pendingtransactions,
        nounce:nounce,
        hash:hash,
        prevblockhash:prevblockhash

    };
    this.pendingtransactions=[];//all prev transactions are stored in the above transaction
    f.push(newblock);
    return newblock;

}
blockchain.prototype.lastblock=function(){
    return this.chain[this.chain.length-1];
}
blockchain.prototype.createtransactions=function(from,to,amt){
    const newtransaction={
     from:from,
     to:to,
     amt:amt,
     transactionid:uuid().split('-').join('')
    }
   // console.log(newtransaction)
    this.pendingtransactions.push(newtransaction);
    return this.lastblock()['index']+1;

}
blockchain.prototype.createblockhash=function(nounce,prevblockhash,currentblockdata){
    var cbd=prevblockhash+nounce+JSON.stringify(currentblockdata);
    var hash=sha(cbd);
    return(hash);
}
blockchain.prototype.pow=function(prevblockhash,currentblockdata){
    var nounce=0;
    let hash=this.createblockhash(nounce,prevblockhash,currentblockdata)
    while(hash.substring(0,4)!='0000'){
        nounce++
        hash=this.createblockhash(nounce,prevblockhash,currentblockdata)
    }
    var hashnounce={
            hash:hash,
            nounce:nounce
    }
    console.log(currentblockdata);
  return(hashnounce)

}
blockchain.prototype.chainisvalid=function(blockchain){
    var chainisvalid=true
    for(i=1;i<blockchain.chain.length;i++){
        prevblock=blockchain.chain[i-1];
        currentblock=blockchain.chain[i];
        var hash=this.createblockhash(currentblock['nounce'],prevblock['hash'],{transaction:currentblock['transaction'],index:currentblock['index']  }    )
        if(prevblock['hash']!=currentblock['prevblockhash'])chainisvalid=false;
            
        if(hash.substring(0,4)!='0000')chainisvalid=false;
       
       
    }
    const genesisblock=blockchain.chain[0];
    if(genesisblock['nounce']==100&&genesisblock['prevblockhash']=='0'&&genesisblock['hash']=='0')
    {
        
    }
    else
    {
        chainisvalid=false;
    }
    return chainisvalid;

}
blockchain.prototype.getblock=function(hashvalue){
    var reqblock;
  this.chain.forEach((block)=>{
      
      if(block.hash==hashvalue){
       
        reqblock=block }

  
     
  })
  console.log('reaced');
  return reqblock;
}
blockchain.prototype.gettransaction=function(transid){
    var reqtransaction;
  this.chain.forEach((block)=>{
      block.transaction.forEach(trans=>{
          if(trans.transactionid==transid)
          reqtransaction=trans
      })

      
     
  
     
  })
  console.log('reaced');
  return reqtransaction;
}
blockchain.prototype.profiledetails=function(member){
    var membertransaction=[];
    console.log(member)
  this.chain.forEach((block)=>{
      block.transaction.forEach(trans=>{
          if(trans.from==member||trans.to==member){
          membertransaction.push(trans);
          console.log(trans)
          }
      })

      
     
  
     
  })
  console.log('reaced');
  return membertransaction;
}
module.exports=blockchain;