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
        case "blue_check":
            dnr_update();
            const settings = chrome.storage.local.get("cslp_settings", async function(value){});
            let resp = async function(){
                return new Promise((resolve)=>{
                    chrome.storage.local.get("cslp_settings", function(value){
                        let guest_token = null;
                        console.log(value);
                        const now_date = new Date().getTime();
                        const now_date_unix = Math.floor(now_date/1000);
                        if(now_date_unix - JSON.parse(value.cslp_settings).tw_guest_token_date >= 1800){//30分でゲストトークン更新
                            console.log(now_date_unix - JSON.parse(value.cslp_settings).tw_guest_token_date)
                            let save_data = JSON.parse(value.cslp_settings);
                            //gust_token取得保存
                            get_gtoken().then((resp)=>{
                                //console.log(resp)
                                guest_token = resp;
                                save_data.tw_guest_token = guest_token;
                                save_data.tw_guest_token_date = now_date_unix;
                                chrome.storage.local.set({'cslp_settings': JSON.stringify(save_data)}, function () {
                                    //console.log("guest_token_save");
                                    //console.log(guest_token);
                                    resolve(blue_check(guest_token, request.message.target));
                                });
                            });
                        }else{
                            console.log("guest_token_ok");
                            guest_token = JSON.parse(value.cslp_settings).tw_guest_token;
                            //console.log(guest_token);
                            resolve(blue_check(guest_token, request.message.target))
                        }
                    });
                });
            }
            return await resp();
        case "developer_report_share":
            //情報提供用なので投げっぱなしでOK
            const send_data = {tweet_user_id:request.message.target.tweet_user_id, tweet_user_name:request.message.target.tweet_user_name, tweet_text:request.message.target.tweet_text, tweet_length:request.message.target.tweet_length};
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
            return new Promise((resolve)=>{
                chrome.cookies.get({url:'https://x.com/', name:'ct0'}, function(cookies){
                    resolve(cookies.value);
                });
            });
        case "login_userid_get":
            return new Promise((resolve)=>{
                chrome.cookies.get({url:'https://x.com/', name:'twid'}, function(cookies){
                    resolve(cookies.value);
                });
            });
        default:
            break;
    }
}
//Twitter_Blue検出用関数
async function blue_check(gt, account){
    //使用しているBearer TokenはXが使いまわしている固定のトークンなので問題無し
    let default_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    let url = `https://xcom/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?variables={"screen_name":"${account}","withSafetyModeUserFields":true}&features={"hidden_profile_likes_enabled":false,"hidden_profile_subscriptions_enabled":false,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"subscriptions_verification_info_is_identity_verified_enabled":false,"subscriptions_verification_info_verified_since_enabled":true,"highlights_tweets_tab_ui_enabled":true,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"responsive_web_graphql_timeline_navigation_enabled":true}&fieldToggles={"withAuxiliaryUserLabels":false}`;
    return new Promise((resolve)=>{
        fetch(encodeURI(url), {
            headers: {
                "accept": "*/*",
                "authorization": default_token,
                "x-guest-token": gt,
            },
            mode: "cors",
            credentials: "omit"
        }).then((resp)=>{
            return resp.json();
        }).then((json)=>{
            console.log(json)
            if(Object.keys(json.data.user.result.verification_info).length == 0){
                console.log("Not Blue");
                resolve("no_blue");
            }else{
                console.log("Blue User");
                resolve("blue_user");
            }
        });
    });
};
//Guest_token取得用関数
async function get_gtoken(){
    return new Promise((resolve)=>{
        fetch('https://x.com/undefined').then((res)=>{
            return(res.text());
        }).then((text)=>{
            //console.log(text.match(/gt=[^;]*/)[0].replace(/gt=/, ""));
            resolve(text.match(/gt=[^;]*/)[0].replace(/gt=/, ""));
        });
    });
};

async function dnr_update() {
    await chrome.declarativeNetRequest.updateEnabledRulesets(({disableRulesetIds: ["ruleset_1"]}));
    await chrome.declarativeNetRequest.updateEnabledRulesets(({enableRulesetIds: ["ruleset_1"]}));
}