chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    check_main(request).then((res)=>{
        sendResponse(res);
    });
    return true;
});
//チェック関連関数
async function check_main(request){
    switch (request.message.mode){
        case "advanced_check":
            console.log(request.message.message)
            return new Promise((resolve)=>{
                fetch(request.message.target, {credentials: "omit"}).then(response => {
                    if (!response.ok) {
                      console.error('t.co load error!');
                      console.log("error");
                      resolve({type:"tco_err", url:null});
                    }
                    if(response.redirected){
                        resolve({type:"redirect", url:response.url, base_url:request.message.target});
                        return null;
                    }else{
                        return response.text();
                    }
                  }).then(text => {
                    let doc_match_baseurl = null;
                    if(text != null){
                        console.log(text)
                        console.log(text.match(/(https?:\/\/[^<"]*)/g));
                        let target_url = text.match(/(https?:\/\/[^<"]*)/g);
                        if(target_url.length <= 10){
                            fetch(target_url[0], {credentials: "omit"}).then(response => {
                                if (!response.ok) {
                                    console.error('load error!');
                                    resolve({type:"load_err", url:response.url, base_url:target_url[0]});
                                }
                                console.log(response)
                                if(response.redirected){
                                    resolve({type:"redirect", url:response.url, base_url:target_url[0]});
                                    return null;
                                }else{
                                    doc_match_baseurl = response.url;
                                    return response.text();
                                }
                            }).then(text => {
                                if(text != null){
                                    console.log(text);
                                    console.log(text.match(/(https?:\/\/[^'"]*)/g));
                                    let txt_match_array = text.match(/(https?:\/\/[^'"]*)/g);
                                    resolve({type:"document_match", url:txt_match_array, base_url:doc_match_baseurl});
                                }
                            });
                        }else{
                            resolve({type:"document_match", url:target_url, base_url:request.message.target});
                        }
                    }
                });
            });
        case "developer_report_share":
            //情報提供用なので投げっぱなしでOK
            const send_data = {tweet_user_id:request.message.target.tweet_user_id, tweet_user_name:request.message.target.tweet_user_name, tweet_text:request.message.target.tweet_text, tweet_length:request.message.target.tweet_length, report_json_data:request.message.target.report_json_data};
            console.log(send_data)
            fetch(`https://${request.message.target.report_srv_url}`,{method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(send_data)}).then(function(res){
                return res.json();
            }).then(function(json_value){
                //console.log(json_value);
            }).catch(error => {
                console.warn('情報共有サーバーとの通信に失敗しました。', error);
              });
            break;
        case "ct0_token_get":
            let access_host_ct0 = "x.com";
            if(request.message.target.target_host_mode == "twitter.com"){
                access_host_ct0 = "twitter.com";
            }
            return new Promise((resolve)=>{
                chrome.cookies.get({url:`https://${access_host_ct0}/`, name:'ct0'}, function(cookies){
                    resolve(cookies.value);
                });
            });
        case "login_userid_get":
            console.log(request.message.target)
            let access_host_userid = "x.com";
            if(request.message.target.target_host_mode == "twitter.com"){
                access_host_userid = "twitter.com";
            }
            return new Promise((resolve)=>{
                chrome.cookies.get({url:`https://${access_host_userid}/`, name:'twid'}, function(cookies){
                    resolve(cookies.value);
                });
            });
        default:
            break;
    }
}