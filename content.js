let block_list;
let block_regexp;
const arabic_regexp = new RegExp("[\u0600-\u060f\u0610-\u061f\u0620-\u062f\u0630-\u063f\u0640-\u064f\u0650-\u065f\u0660-\u066f\u0670-\u067f\u0680-\u068f\u0690-\u069f\u06a0-\u06af\u06b0-\u06bf\u06c0-\u06cf\u06d0-\u06df\u06e0-\u06ef\u06f0-\u06ff]");
let advanced_regexp;
let s_key_down = null;
let debug_block_num_text = Math.random().toString(32).substring(2);
let debug_block_num = Math.random().toString(32).substring(2);
let shift_key_status = 0;
chrome.storage.local.get("cslp_settings", function(value){
    if(value.cslp_settings != undefined){
        if(JSON.parse(value.cslp_settings).filter_latest == true){
            main("https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/filter.json");
        }else{
            main(chrome.runtime.getURL("filter.json"));
        }
    }else{
        main(chrome.runtime.getURL("filter.json"));
    }
});
function main(filter_url){
console.log("Clean-Spam-Link-Tweet is Working!");
if(filter_url == "https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/filter.json"){
    console.log(`Use Official Online List:${filter_url}`);
}else{
    console.log(`Use internal List:${filter_url}`);
}  
    fetch(filter_url, {
    method: "GET",
    cache: "no-store"
}).then(response => {
    if (!response.ok) {
        console.error('List load error!');
        alert("Clean-Spam-Link-Tweetのフィルタ読み込みに失敗しました。「常に最新のリストを使用」を無効にしてください。")
    }
    return response.json();
}).then(json => {
    console.log(`List Load!\r\nList update:${json[0].developer_update}\r\nList provider:${json[0].thanks_link}\r\nThanks '${json[0].thanks_name}' !`);
    let reg_exp = json[1].concat_regex;
    block_list = json;
    //設定
    let cslp_settings = null;
    chrome.storage.local.get("cslp_settings", function(value){
        let cslp_update_flag = null;
        if(value.cslp_settings != undefined){
            if(JSON.parse(value.cslp_settings).version != chrome.runtime.getManifest().version){
                cslp_update_flag = true;
            }else{
                cslp_update_flag = false;
            }
        }
        cslp_settings = value;
        if(value.cslp_settings == undefined || cslp_update_flag == true){
            console.log("settings init...");
            cslp_settings = {
                filter:true, 
                hit_del:false,
                disable_hit:false,
                amazon_hit:false,
                filter_latest:true,
                hit_url_copy:false,
                hit_url_copy_mode:"0",
                hit_url_copy_user_text:"%t_co%,%bl_url%,%adv_addr%,%tw_id%,%tw_date%",
                hit_url_copy_advanced:false,
                hit_url_copy_advanced_filter:false,
                stealth_blue_view:false,
                blue_block:false,
                blue_block_value_num:"10",
                blue_block_mode:"0",
                arabic_reply_block:false,
                version:chrome.runtime.getManifest().version,
                filter_update:json[0].developer_update,
                filter_link:json[0].thanks_link,
                filter_thanks:json[0].thanks_name,
                tw_guest_token:null,
                tw_guest_token_date:null
            };
            chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
                console.log(`init coplete!:${cslp_settings}`);
                if(cslp_update_flag == true){
                    alert("Clean-Spam-Link-Tweetバージョンが更新されたため、設定の初期化を行いました。\r\nTwitterの再読み込みを行ってください。");
                }else{
                    alert("Clean-Spam-Link-Tweetの初期設定構築が完了しました。\r\nTwitterの再読み込みを行ってください。");
                }
            });
        }else{
            console.log("settings found!");
            cslp_settings = JSON.parse(cslp_settings.cslp_settings);
            const target_elem = document.getElementById("react-root");
            //Write Latest Version
            cslp_settings.filter_update = json[0].developer_update;
            cslp_settings.filter_link = json[0].thanks_link;
            cslp_settings.filter_thanks = json[0].thanks_name;
            chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
                console.log("Filter Version Write OK");
            });
            //Regex
            if(cslp_settings.disable_hit == true){
                reg_exp += `|${json[1].disable_concat_regex}`;
            }
            if(cslp_settings.amazon_hit == true){
                reg_exp += "|(amazon.co.jp)";
            }
            block_regexp = new RegExp(reg_exp);
            advanced_regexp = json[1].hit_url_adv_filter;
            //コピー用divキーダウン有効
            if(cslp_settings.hit_url_copy == true){
                document.addEventListener("keydown", function(key){
                    if(key.code == "ControlLeft") {
                        if(shift_key_status == 0){
                            for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "visible";
                            }
                        }
                        shift_key_status = 1;
                      }
                });
                document.addEventListener("keyup", function(key){
                    if(key.code == "ControlLeft") {
                        if(shift_key_status == 1){
                            for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                            }
                        }
                        shift_key_status = 0;
                      }
                });
            }
            let stealth_blue_once = true;
            let old_user_name = null;
            //メイン動作関数
            function run(){
                if(cslp_settings.stealth_blue_view == true){
                    if(old_user_name != document.querySelector('div[data-testid="UserName"] [tabindex="-1"]')?.innerText.replace("@", "")){
                        if(document?.querySelector('[cslt_flag="stealth_blue_icon"]') != null){
                            document.querySelector('[cslt_flag="stealth_blue_icon"]').remove();
                        }
                        old_user_name = window.location.pathname.split("/")[1];
                        stealth_blue_once = true;
                    }
                    if(document.querySelector('div[data-testid="UserName"] [tabindex="-1"]')?.innerText.replace("@", "") != undefined){
                        if(document?.querySelector('div[data-testid="UserName"] div svg[data-testid="icon-verified"]') != null){
                            if(document?.querySelector('[cslt_flag="stealth_blue_icon"]') != null){
                                document.querySelector('[cslt_flag="stealth_blue_icon"]').remove();
                            }
                        }
                        const user_name = document.querySelector('div[data-testid="UserName"] [tabindex="-1"]').innerText.replace("@", "");
                        stealth_blue_append(user_name, stealth_blue_once);
                        stealth_blue_once = false;
                        
                    }
                }
                if(window.location.pathname.split("/")[2] == 'status' && cslp_settings.blue_block == true){
                    let blue_target_elem = document.querySelectorAll('[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[data-testid="User-Name"] svg[data-testid="icon-verified"]');
                    let all_rep = document.querySelectorAll('[data-testid="cellInnerDiv"] article[data-testid="tweet"]');
                    switch (cslp_settings.blue_block_mode) {
                        //Blueマーク付を文字数で非表示
                        case "0":
                            //console.log(Number(cslp_settings.blue_block_value_num));
                            for(let index = 1; index <= blue_target_elem.length; index++) {
                                if(typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag") != "undefined"){
                                    if(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag")!= "blue_ok" && typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]') != "null"){
                                        const tweet_text = blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]').innerText;
                                        if(tweet_text.length <= Number(cslp_settings.blue_block_value_num)){
                                            //console.log(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]'));
                                            blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_flag", "blue_ok");
                                            blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').textContent = ``;
                                        }
                                    }
                                }
                            }
                            break;
                        //全ユーザーを文字数で非表示
                        case "1":
                            //console.log(Number(cslp_settings.blue_block_value_num));
                            for(let index = 1; index <= all_rep.length; index++) {
                                //console.log(all_rep[index].closest('[data-testid="cellInnerDiv"]'))
                                if(typeof all_rep[index]?.closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag") != "undefined"){
                                    if(all_rep[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag") != "blue_ok" && typeof all_rep[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]') != "null"){
                                        const tweet_text = all_rep[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]').innerText;
                                        if(tweet_text.length <= Number(cslp_settings.blue_block_value_num)){
                                            //console.log(all_rep[index].closest('[data-testid="cellInnerDiv"]'));
                                            all_rep[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_flag", "blue_ok");
                                            all_rep[index].closest('[data-testid="cellInnerDiv"]').textContent = ``;
                                        }
                                    }
                                }
                            }
                            break;
                        //Blueマーク付を全て非表示
                        case "2":
                            for(let index = 1; index < blue_target_elem.length; index++) {
                                if(typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag") != "undefined"){
                                    if(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag")!= "blue_ok"){
                                        //console.log(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]'));
                                        blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_flag", "blue_ok");
                                        blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').textContent = ``;
                                    }
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
                //アラビア文字が含まれた返信
                if(cslp_settings.arabic_reply_block == true){
                   //console.log("arabicdelete") 
                    for (let index = 0; index < document.querySelectorAll('[data-testid="tweetText"]').length; index++) {
                        if(arabic_regexp.test(document.querySelectorAll('[data-testid="tweetText"]')[index].innerText)){
                            let target = document.querySelectorAll('[data-testid="tweetText"]')[index];
                            target.closest('[data-testid="cellInnerDiv"]').textContent = "";
                        }
                    }
                    
                }
                //TwitterCardではないスパムの場合
                for(let index = 0; index < document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]').length; index++){
                    debug_block_num_text = Math.random().toString(32).substring(2);
                    //ツイート内にリンク(要素全体)を検出
                    if(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index] != undefined){
                        //ヒットツイート削除設定無効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->阻止
                        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].textContent) && document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].getAttribute("cslt_flag") != "ok"){
                            let ins_html;
                            if(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetWidth < 230){
                                ins_html = `<div style="position: absolute;z-index: 99999;width: ${document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetWidth+1}px;height: ${document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetHeight+5}px;max-height:25px;display: inline-flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;font-size: 0.5rem;"><p>スパム</p></div>`;
                            }else{
                                ins_html = `<div style="position: absolute;z-index: 99999;width: ${document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetWidth+1}px;height: ${document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetHeight+5}px;max-height:25px;display: inline-flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;"><p>スパムを検出!&nbsp;(${document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].textContent.match(/\/\/([^/]*)/)[1]})</p></div>`;
                            }
                            document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].style.whiteSpace = "nowrap";
                            document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].setAttribute("cslt_flag", "ok");
                            document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].insertAdjacentHTML("beforebegin", ins_html);
                            copy_url(index, debug_block_num_text, "text");
                        }
                        //ヒットツイート削除設定有効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->削除
                        if(cslp_settings.hit_del == true && block_regexp.test(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].textContent)){
                            document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].closest('[data-testid="cellInnerDiv"]').textContent = "";
                        }
                    }
                }
                //TwitterCardの場合(bnc.ltなど)
                for (let index = 0; index < document.querySelectorAll('[data-testid="card.wrapper"]').length; index++) {
                    debug_block_num = Math.random().toString(32).substring(2);
                    //TwitterCard内にリンク(要素全体)を検出
                    if(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="ltr"], [dir="auto"]')[0] != undefined){
                        //ヒットツイート削除設定無効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->阻止
                        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="ltr"], [dir="auto"]')[0].textContent) && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
                            //console.log("found!");
                            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
                            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>ヒットしたURL:${document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="ltr"], [dir="auto"]')[0].textContent}<br>クリックでツイートを開く</p></div>`;
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
                            copy_url(index, debug_block_num, "tw_card");
                        }
                        //ヒットツイート削除設定有効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->削除
                        if(cslp_settings.hit_del == true && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="ltr"], [dir="auto"]')[0].textContent)){
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].closest('[data-testid="cellInnerDiv"]').textContent = "";
                        }
                    }
                }
            };
            if(JSON.parse(cslp_settings.filter) == true){
                const observer = new MutationObserver(run)
                observer.observe(target_elem,{
                    childList: true,
                    attributes: true,
                    characterData: true,
                    subtree: true,
                    attributeOldValue: true,
                    characterDataOldValue: true
                });
            }
            //URLコピー関数
            function copy_url(index, debug_block_num, tw_mode) {
                //コピー変数
                let copy_tw_id = null;
                let copy_tw_date = null;
                let copy_t_co_addr = null;
                let copy_base_addr = null
                let copy_adv_resp_addr = null;
                //
                if (cslp_settings.hit_url_copy == true) {
                    let debug_ins_html = `<div id="cslt_filter${debug_block_num}" class="cslt_copy_filter" style="width: 100%;height: 100%;position: absolute;z-index: 100;display: flex;align-items: center;text-align: center;justify-content: center;font-weight:bold;background-color: rgba(0,0,0,0.75);color: #fff;outline:solid 5px #ffab11;outline-offset:-5px;cursor:copy;visibility:hidden;">クリックでURLをコピー</div>`;
                    switch (tw_mode) {
                        case "text":
                            document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].closest('[data-testid="cellInnerDiv"]').insertAdjacentHTML("afterbegin", debug_ins_html);
                            break;
                        case "tw_card":
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].closest('[data-testid="cellInnerDiv"]').insertAdjacentHTML("afterbegin", debug_ins_html);
                            break;
                    }
                    //console.log(`cslt_filter${debug_block_num}`)
                    document.getElementById(`cslt_filter${debug_block_num}`).addEventListener("click", function () {
                    //console.log(this)
                    //ツイート情報取得
                    const get_tw_id_url = new URL(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"] a[dir="ltr"]').href);
                    const get_tw_date = new Date(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"] a[dir="ltr"] time').getAttribute("datetime"));                    
                    copy_tw_id = get_tw_id_url.pathname.match("/status/(\\d+)")[1];
                    copy_tw_date = `${get_tw_date.getFullYear()}_${(get_tw_date.getMonth()+1).toString().padStart(2, '0')}_${get_tw_date.getDate().toString().padStart(2, '0')}_${get_tw_date.getHours()}_${get_tw_date.getMinutes()}_${get_tw_date.getSeconds()}`;
                    //アドバンスドURL解析
                    if(cslp_settings.hit_url_copy_advanced == true){
                        let target_element_a = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a');
                        let target_url = null;
                        //アドバンスド解析ベースのコピーモード
                        if(this.parentElement.querySelectorAll('[data-testid="tweetText"] a').length != 0){
                            target_element_a = this.parentElement.querySelectorAll('[data-testid="tweetText"] a');
                        }
                        if(this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a').length != 0){
                            target_element_a = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a');
                        }
                        //console.log(target_element_a)
                        for (let index = 0; index < target_element_a.length; index++) {
                            if(target_element_a[index].href.match("twitter.com") == null){
                                if(target_element_a[index].href.match("t.co") != null){
                                    //console.log(target_element_a[index].href);
                                    target_url = target_element_a[index].href;
                                    break;
                                }else{
                                    //console.log(target_element_a[index].href);
                                    target_url = target_element_a[index].href;
                                    break;
                                }
                            }
                        }
                        //this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href => target_url
                        if (target_url.match(/([^\/]+)/g)[1] != "t.co") {
                            //console.log(target_url.match(/([^\/]+)/g)[1] != "t.co");
                            let tco_addr = target_url;
                            //console.log(target_url)
                            chrome.runtime.sendMessage({message: {mode:"advanced_check", target:tco_addr}}, (response) => {
                                if(cslp_settings.hit_url_copy_mode != "3"){
                                    //console.log(response);
                                    console.log(response.url);
                                    if(Array.isArray(response.url) == true){
                                        let filtered_array = new Array();
                                        if(cslp_settings.hit_url_copy_advanced_filter == true){
                                            for (let index = 0; index < response.url.length; index++) {
                                                if(response.url[index].match(response.base_url+"|"+advanced_regexp) == null){
                                                    //console.log(response.url[index]);
                                                    filtered_array.push(response.url[index]);
                                                }
                                            }
                                            let filtered_array_concat = response.base_url+","+filtered_array.join(",");
                                            navigator.clipboard.writeText(filtered_array_concat).then(()=>{
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型・フィルタ済)\r\n他の拡張機能との競合や広告である可能性があります。\r\nCopy->${filtered_array_concat}`);
                                            });
                                        }else{
                                            let array_concat = response.base_url+","+response.url.join(",");
                                            navigator.clipboard.writeText(array_concat).then(()=>{
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型)\r\n他の拡張機能との競合や広告である可能性があります。\r\nCopy->${array_concat}`);
                                            });
                                        }
                                    }else{
                                        let concat_urls = response.base_url+","+response.url;
                                        navigator.clipboard.writeText(concat_urls).then(()=>{
                                            hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト型)\r\n他の拡張機能との競合や広告である可能性があります。\r\nnCopy->${concat_urls}`);
                                        });
                                    }
                                }else{
                                    if(Array.isArray(response.url) == true){
                                        let filtered_array = new Array();
                                        if(cslp_settings.hit_url_copy_advanced_filter == true){
                                            for (let index = 0; index < response.url.length; index++) {
                                                if(response.url[index].match(response.base_url+"|"+advanced_regexp) == null){
                                                    //console.log(response.url[index]);
                                                    filtered_array.push(response.url[index]);
                                                }
                                            }
                                            copy_t_co_addr = target_url;
                                            copy_base_addr  = response.base_url;
                                            copy_adv_resp_addr = filtered_array.join(",");
                                        }else{
                                            copy_t_co_addr = target_url;
                                            copy_base_addr  = response.base_url;
                                            copy_adv_resp_addr = response.url.join(",");
                                        }
                                    }else{
                                        copy_t_co_addr = target_url;
                                        copy_base_addr  = response.base_url;
                                        copy_adv_resp_addr = response.url;
                                    }
                                    const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                    navigator.clipboard.writeText(copy_text).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。`);
                                    });
                                }
                            });
                        }else{
                            let tco_addr = target_url;
                            //console.log(tco_addr)
                            chrome.runtime.sendMessage({message: {mode:"advanced_check", target:tco_addr}}, (response) => {
                                if(cslp_settings.hit_url_copy_mode != "3"){
                                    //console.log(response);
                                    //console.log(response.url);
                                    if(Array.isArray(response.url) == true){
                                        let filtered_array = new Array();
                                        if(cslp_settings.hit_url_copy_advanced_filter == true){
                                            //console.log(advanced_regexp)
                                            for (let index = 0; index < response.url.length; index++) {
                                                if(response.url[index].match(response.base_url+"|"+advanced_regexp) == null){
                                                    //console.log(response.url[index]);
                                                    filtered_array.push(response.url[index]);
                                                }
                                            }
                                            let filtered_array_concat = response.base_url+","+filtered_array.join(",");
                                            navigator.clipboard.writeText(filtered_array_concat).then(()=>{
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型・フィルタ済)\r\nCopy->${filtered_array_concat}`);
                                            });
                                        }else{
                                            let array_concat = response.base_url+","+response.url.join(",");
                                            navigator.clipboard.writeText(array_concat).then(()=>{
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型)\r\nCopy->${array_concat}`);
                                            });
                                        }
                                    }else{
                                        let concat_urls = response.base_url+","+response.url;
                                        navigator.clipboard.writeText(concat_urls).then(()=>{
                                            hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト型)\r\nCopy->${concat_urls}`);
                                        });
                                    }
                                }else{
                                    if(Array.isArray(response.url) == true){
                                        let filtered_array = new Array();
                                        if(cslp_settings.hit_url_copy_advanced_filter == true){
                                            //console.log(advanced_regexp)
                                            for (let index = 0; index < response.url.length; index++) {
                                                if(response.url[index].match(response.base_url+"|"+advanced_regexp) == null){
                                                    //console.log(response.url[index]);
                                                    filtered_array.push(response.url[index]);
                                                }
                                            }
                                            copy_t_co_addr = target_url;
                                            copy_base_addr = response.base_url;
                                            copy_adv_resp_addr = filtered_array.join(",");
                                        }else{
                                            copy_t_co_addr = target_url;
                                            copy_base_addr = response.base_url;
                                            copy_adv_resp_addr = response.url.join(",");
                                        }
                                    }else{
                                        copy_t_co_addr = target_url;
                                        copy_base_addr = response.base_url;
                                        copy_adv_resp_addr = response.url;
                                    }
                                    const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                    navigator.clipboard.writeText(copy_text).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}`);
                                    });
                                }
                            });
                        }
                    }else{
                        //従来のコピーモード
                        async function get_blockurl(tco_url) {
                            let get_url = null;
                            await fetch(tco_url).then(response => {
                              if (!response.ok) {
                                console.error('t.co load error!');
                              }
                              return response.text();
                            }).then(text => {
                              let tco_resp = null;
                              tco_resp = new DOMParser().parseFromString(text, 'text/html');
                              for (let index_url_get = 0; index_url_get < tco_resp.querySelectorAll("meta").length; index_url_get++) {
                                if (tco_resp.querySelectorAll("meta")[index_url_get].content.match(/https?:\/\/\S*/) != null) {
                                  //console.log(tco_resp.querySelectorAll("meta")[index_url_get].content.match(/https?:\/\/\S*/)[0]);
                                  get_url = tco_resp.querySelectorAll("meta")[index_url_get].content.match(/https?:\/\/\S*/)[0];
                                  break;
                                }
                              }
                            });
                            return get_url;
                          }
                          switch (cslp_settings.hit_url_copy_mode) {
                            case "0":
                                if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                                navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href);
                                hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href}\r\n他の拡張機能との競合や広告をコピーした可能性があります。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                } else {
                                get_blockurl(this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href).then(function (url) {
                                    navigator.clipboard.writeText(url).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${url}`);
                                    });
                                });
                                }
                                break;
                            case "1":
                                if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                                    navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスでコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href}`);
                                    });
                                }
                                break;
                            case "2":
                                if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                                    let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href;
                                    navigator.clipboard.writeText(`${tco_addr},${tco_addr}`).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${tco_addr},${tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href;
                                    get_blockurl(tco_addr).then(function (url) {
                                        let cl_text = `${url},${tco_addr}`;
                                        //console.log(cl_text);
                                        navigator.clipboard.writeText(cl_text).then(()=>{
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${cl_text}`);
                                        });
                                    })
                                }
                                break;
                            case "3":
                                if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                                    let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href;
                                    //navigator.clipboard.writeText(`${tco_addr},${tco_addr}`);
                                    //hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${tco_addr},${tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。`);
                                    copy_t_co_addr = tco_addr;
                                    copy_base_addr = tco_addr;
                                    const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                    navigator.clipboard.writeText(copy_text).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a')[0].href;
                                    get_blockurl(tco_addr).then(function (url) {
                                        let cl_text = `${url},${tco_addr}`;
                                        //console.log(cl_text);
                                        //navigator.clipboard.writeText(cl_text);
                                        //hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${cl_text}`);
                                        copy_t_co_addr = tco_addr;
                                        copy_base_addr = url;
                                        const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                        navigator.clipboard.writeText(copy_text).then(()=>{
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}`);
                                        });
                                    })
                                }
                                break;
                          }
                        }
                        function hide_cp_msg(message){
                            if(confirm(message)){
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                                }
                                shift_key_status = 0;
                            }else{
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                                }
                                shift_key_status = 0;
                            }
                        }
                    });
                }
              }
            }
        })
    }).catch(error => {
        console.error('List load error!', error);
    });

//結合された正規表現を作成するときに使う関数(定義更新を作るときとか。)
function concat_block_list(){
    let concat_list = new Array();
    for (let index_b = 0; index_b < block_list[1].length; index_b++) {
        //console.log(index_b)
        concat_list.push(`${block_list[1][index_b].regex}|`)
    }
    console.log(`(${concat_list.join("").slice(0, -1)})`);
}
}

function stealth_blue_append(user_name, status){
    if(document.querySelector('div[data-testid="UserName"] span').getAttribute("cslt_flag") != "user_check_ok"){
        
    }
    if(status != false){
            if(document?.querySelector('div[data-testid="UserName"] div svg[data-testid="icon-verified"]') == null){
                chrome.runtime.sendMessage({message: {mode:"blue_check", target:user_name}}, (response) => {
                    console.log(`@${user_name} is ${response}!`);
                    //console.log(status);
                    if(response == "blue_user"){
                        document.querySelector('div[data-testid="UserName"] span').setAttribute("cslt_flag", "user_check_ok");
                        document.querySelector('div[data-testid="UserName"] span:last-child').insertAdjacentHTML("beforeend", `<span cslt_flag="stealth_blue_icon" style="margin-left: 2px;"><img style="height: 1.25em; max-height: 16px;" src="${chrome.runtime.getURL("stealth_icon.svg")}" title="このアカウントはPremium(Blue)の表示を隠しています"/></span>`);
                    }else{
                        document.querySelector('div[data-testid="UserName"] span').setAttribute("cslt_flag", "user_check_ok");
                    }
                })
            }else{
                console.log(`@${user_name} is displayed Blue!`);
            }
        }
}