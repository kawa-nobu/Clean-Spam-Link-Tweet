//let imp_account = new Array();
let block_list;
let block_regexp;
let imp_user_block_list_regexp;
//\u0600-\u060f\u0610-\u061f\u0620-\u062f\u0630-\u063f\u0640-\u064f\u0650-\u065f\u0660-\u066f\u0670-\u067f\u0680-\u068f\u0690-\u069f\u06a0-\u06af\u06b0-\u06bf\u06c0-\u06cf\u06d0-\u06df\u06e0-\u06ef\u06f0-\u06ff
//アラビア文字&デーヴァナーガリー文字(&拡張)
const arabic_regexp = new RegExp("[\u0600-\u06ff\u0900-\u097f\ua8e0-\ua8ff]");
let advanced_regexp;
let s_key_down = null;
let debug_block_num_text = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
let debug_block_num = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
let shift_key_status = 0;
let l_key_status = 0;
//ブロック・ミュートツイートID格納
let block_mute_user_ids = [];
let block_mute_user_ids_regex = null;
//報告ツイートID格納
let report_tweet_status_ids = [];
let report_tweet_status_ids_regex = null;
//報告失敗ツイートID格納
let fail_report_tweet_status_ids = [];
let fail_report_tweet_status_ids_regex = null;
//ブロック・ミュート失敗ID格納
let fail_block_mute_user_ids = [];
let fail_block_mute_user_ids_regex = null;
//報告情報一時保管関数
function report_ids_temp(id, mode){//report_ids_temp(id, mode)"block_mute""report"
    switch (mode) {
        case "block_mute":
            //ブロック済ユーザーIDを保存
            block_mute_user_ids.push(id);
            block_mute_user_ids_regex = new RegExp(block_mute_user_ids.join('|'), 'g');
            return  true;
        case "report":
            //報告完了IDを保存
            report_tweet_status_ids.push(id);
            report_tweet_status_ids_regex = new RegExp(report_tweet_status_ids.join('|'), 'g');
            return true;
        case "fail_report":
            //報告完了IDを保存
            if(fail_report_tweet_status_ids.includes(id) != true){
                fail_report_tweet_status_ids.push(id);
                fail_report_tweet_status_ids_regex = new RegExp(fail_report_tweet_status_ids.join('|'), 'g');
                console.log(fail_report_tweet_status_ids)
                return true;
            }else{
                return false;
            }
        case "fail_report_delete":
            //報告完了IDを削除
            fail_report_tweet_status_ids.filter(function(imp){return imp != id});
            fail_report_tweet_status_ids_regex = new RegExp(fail_report_tweet_status_ids.join('|'), 'g');
            console.log(fail_report_tweet_status_ids)
            return true;
        case "fail_block_mute":
            if(fail_block_mute_user_ids.includes(id) != true){
                fail_block_mute_user_ids.push(id);
                fail_block_mute_user_ids_regex = new RegExp(fail_block_mute_user_ids.join('|'), 'g');
                console.log(fail_block_mute_user_ids)
                return true;
            }else{
                return false;
            }
        case "fail_block_mute_delete":
            fail_block_mute_user_ids.filter(function(imp){return imp != id});
            fail_block_mute_user_ids_regex = new RegExp(fail_block_mute_user_ids.join('|'), 'g');
            console.log(fail_block_mute_user_ids)
            return true;
        default:
            return false;
    }

}
//CSS&新ツイート解析スクリプト挿入
document.head.insertAdjacentHTML("beforeend", `
<style cslt_css>
.cslt_report_icon{
    background:url(${chrome.runtime.getURL("report_icon.svg")});
    background-repeat: no-repeat;
    width: 20px;
    height: 20px;
    margin-left: 5px;
}
.cslt_report_icon:hover{
    filter: invert(13%) sepia(89%) saturate(6665%) hue-rotate(343deg) brightness(95%) contrast(106%);
}
.cslt_report_complete{
    filter: invert(76%) sepia(20%) saturate(2691%) hue-rotate(66deg) brightness(102%) contrast(97%);
}
.cslt_report_fail{
    background:url(${chrome.runtime.getURL("report_fail_icon.svg")}) !important;
    background-repeat: no-repeat;
    width: 20px;
    height: 20px;
    margin-left: 5px;
    filter: invert(13%) sepia(89%) saturate(6665%) hue-rotate(343deg) brightness(95%) contrast(106%);
}
.cslt_report_fail:hover{
    filter: brightness(0) saturate(100%) invert(46%) sepia(95%) saturate(2856%) hue-rotate(1deg) brightness(93%) contrast(102%);
}
.cslt_message_wrap{
    display: none;
    position: fixed;
    bottom: 4rem;
    width: 100vw;
    height: 2rem;
    z-index: 9999;
    align-items: center;
    justify-content: center;
}
.cslt_message_content{
    display: flex;
    height: 100%;
    background: #1d9bf0;
    color: white;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    align-content: center;
    justify-content: center;
    align-items: center;
}
.cslt_message_content span{
    margin: 0 1rem 0 1rem;
}
</style>
`);
const tweet_info_script = document.createElement('script');
tweet_info_script.src = chrome.runtime.getURL("cslt_tweet_ctrl.js");
document.head.appendChild(tweet_info_script);
//メッセージパネル挿入
document.body.insertAdjacentHTML("afterbegin", '<div class="cslt_message_wrap"><div class="cslt_message_content"><span class="cslt_message_span">CSLTメッセージ</span></div></div>');
//
chrome.storage.local.get("cslp_settings", function(value){
    if(value.cslp_settings != undefined){
        if(JSON.parse(value.cslp_settings).filter_latest == true){
            main("https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/filter.json", "https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/imp_filter.json");
        }else{
            main(chrome.runtime.getURL("filter.json"), chrome.runtime.getURL("imp_filter.json"));
        }
    }else{
        main(chrome.runtime.getURL("filter.json"), chrome.runtime.getURL("imp_filter.json"));
    }
});
function main(filter_url, imp_filter_url){
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
    //console.log(response)
    if (!response.ok) {
        console.error('List load error!');
    }
    return response.json();
}).catch(error =>{
    console.log("Network Error");
    alert("ネットワークエラーにより最新フィルタの読み込みに失敗しました。\r\n内蔵のフィルタを使用します");
    //
    const internal_list = fetch(chrome.runtime.getURL("filter.json"), {
        method: "GET",
        cache: "no-store"
    }).then(response => {
        if (!response.ok) {
            console.error('internal list load error!');
        }
        console.log("Internal List Load");
        return response.json();
    }).catch(error =>{
        console.log("Internal list load error");
        alert("内蔵フィルタリストの自動読み込みに失敗しました");
    })
    return internal_list;
    //
}).then(json => {
    console.log(`List Load!\r\nList update:${json[0].developer_update}\r\nList provider:${json[0].thanks_link}\r\nThanks '${json[0].thanks_name}' !`);
    let reg_exp = json[1].concat_regex;
    const disable_short_url_regexp = new RegExp(json[1].short_url_regex, 'g');
    block_list = json;

    //設定
    let cslp_settings = null;

    chrome.storage.local.get("cslp_settings", function(value){
        let cslp_update_flag = null;
        if(value.cslp_settings != undefined){
            if(JSON.parse(value.cslp_settings).version != chrome.runtime.getManifest().version){
                console.log(JSON.parse(value.cslp_settings))
                console.log("New version");
                cslp_update_flag = true;
            }else{
                cslp_update_flag = false;
            }
        }
        //設定作成&更新関数
        function settings_update(input_setting){
            const cslp_default_settings = {
                filter:true,
                hit_del:false,
                disable_hit:false,
                amazon_hit:false,
                filter_latest:true,
                hit_url_copy:false,
                short_url_hit_disable:false,
                hit_url_copy_mode:"0",
                hit_url_copy_user_text:"%t_co%,%bl_url%,%adv_addr%,%tw_id%,%tw_date%",
                hit_url_copy_advanced:false,
                hit_url_copy_advanced_filter:false,
                stealth_blue_view:false,
                blue_block:false,
                imp_user_block:false,
                follow_list_imp_find_user:false,
                root_tweetuser_block:true,
                blue_block_value_num:"10",
                blue_block_mode:"0",
                arabic_reply_block:false,
                arabic_user_reply_block:false,
                version:chrome.runtime.getManifest().version,
                filter_update:json[0].developer_update,
                filter_link:json[0].thanks_link,
                filter_thanks:json[0].thanks_name,
                tw_guest_token:null,
                tw_guest_token_date:null,
                oneclick_report:false,
                oneclick_report_follow_list:true,
                oneclick_report_confirm:false,
                oneclick_report_timeline_disable:false,
                oneclick_report_after_mode:"0",
                oneclick_report_option:"5",
                oneclick_developer_report:false,
                oneclick_developer_reportsrv_url:"kwdev-sys.com/api/cslt/imp_report_sys/pub_reporter/",
                imp_filter_update:"No loading",
                imp_filter_block_all_area:false
            };
            if(input_setting.cslp_settings != undefined){
                let settings_array = new Object();
                for (let index = 0; index < Object.keys(cslp_default_settings).length; index++) {
                    if(Object.keys(cslp_default_settings)[index] in JSON.parse(input_setting.cslp_settings) == true){
                        if(Object.keys(cslp_default_settings)[index] == "version"){
                            console.log("設定データのバージョンを更新します")
                            settings_array[Object.keys(cslp_default_settings)[index]] = chrome.runtime.getManifest().version;
                        }else{
                            console.log(`引継ぎ=>[${Object.keys(cslp_default_settings)[index]}]=${JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]]}`);
                            settings_array[Object.keys(cslp_default_settings)[index]] = JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]];
                            //報告オプション未対応置き換え
                            if(Object.keys(cslp_default_settings)[index] == 'oneclick_report_option'){
                                const option_data = JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]];
                                //console.log(option_data)
                                if(option_data == "3" || option_data == "4" || option_data == "6" || option_data == "8"){
                                    console.log("報告オプションをスパムに置き換えました")
                                    settings_array[Object.keys(cslp_default_settings)[index]] = "5";
                                }
                            }
                            //
                        }
                    }else{
                        console.log(`新規の設定項目を作成=>[${Object.keys(cslp_default_settings)[index]}]`);
                        settings_array[Object.keys(cslp_default_settings)[index]] = cslp_default_settings[Object.keys(cslp_default_settings)[index]];
                    }
                }
                console.log(settings_array);
                return settings_array;
            }else{
                return cslp_default_settings;
            }
        }
        //
        cslp_settings = value;
        if(value.cslp_settings == undefined || cslp_update_flag == true){
            console.log("settings init...");
            const new_settings = settings_update(value);
            cslp_settings = new_settings;
            //console.log({'cslp_settings': JSON.stringify(cslp_settings)})
            chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
                console.log(`init complete!:${cslp_settings}`);
                if(cslp_update_flag == true){
                    alert("Clean-Spam-Link-Tweetバージョンが更新されました。\r\nTwitterの再読み込みを行ってください。");
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
            if(cslp_settings.short_url_hit_disable == true){
                reg_exp  =  reg_exp.replaceAll(disable_short_url_regexp, "cslt_disable_url");
            }
            block_regexp = new RegExp(reg_exp);
            advanced_regexp = json[1].hit_url_adv_filter;

            //インプ稼ぎフィルタ読み込み
            if(cslp_settings.imp_user_block == true){
                console.log("Use impression list mode");
                fetch(imp_filter_url, {
                    method: "GET",
                    cache: "no-store"
                }).then(response => {
                    if (!response.ok) {
                        console.error('IMP List load error!');
                    }
                    return response.json();
                }).catch(error =>{
                    console.log("Network Error");
                    alert("ネットワークエラーにより最新インプレフィルタの読み込みに失敗しました。\r\n内蔵のフィルタを使用します");
                    //
                    const internal_imp_list = fetch(chrome.runtime.getURL("imp_filter.json"), {
                        method: "GET",
                        cache: "no-store"
                    }).then(response => {
                        if (!response.ok) {
                            console.error('internal List load error!');
                        }
                        console.log("Internal List Load");
                        return response.json();
                    }).catch(error =>{
                        console.log("Internal list load error");
                        alert("内蔵インプレフィルタリストの自動読み込みに失敗しました");
                    })
                    return internal_imp_list;
                    //
                }).then(imp_json => {
                    imp_user_block_list_regexp = new RegExp(imp_json[1].concat_regex);
                    //console.log(imp_user_block_list_regexp)
                    cslp_settings.imp_filter_update = imp_json[0].developer_update;
                    chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
                        console.log("IMP Filter Version Write OK");
                    });
                });
            }

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
                    if(key.code == "KeyL") {
                        if(l_key_status == 0){
                            for (let index = 0; index < document.getElementsByClassName("cslt_tweetdata_copy").length; index++) {
                                document.getElementsByClassName("cslt_tweetdata_copy")[index].style.visibility = "visible";
                            }
                        }
                        l_key_status = 1;
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
                    if(key.code == "KeyL") {
                        if(l_key_status == 1){
                            for (let index = 0; index < document.getElementsByClassName("cslt_tweetdata_copy").length; index++) {
                                document.getElementsByClassName("cslt_tweetdata_copy")[index].style.visibility = "hidden";
                            }
                        }
                        l_key_status = 0;
                    }
                });
            }
            let stealth_blue_once = true;
            let old_user_name = null;
            //メイン動作関数
            function run(){
                //インプ稼ぎ非表示
                if(cslp_settings.imp_user_block == true && window.location.pathname.match("\/status\/")?.length == 1 || cslp_settings.imp_filter_block_all_area == true &&cslp_settings.imp_user_block == true){
                    const tweet_elem = document.querySelectorAll('article[data-testid="tweet"][tabindex="0"]');
                    for (let index = 0; index < tweet_elem.length; index++) {
                        debug_block_num = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
                        //リストと照合&非表示
                        if(tweet_elem[index].querySelector('[data-testid="User-Name"]  a')?.href.replace("https://x.com/", "").replace("https://twitter.com/", "") != null){
                            let tweet_user_id = tweet_elem[index].querySelector('[data-testid="User-Name"]  a').href.replace("https://x.com/", "").replace("https://twitter.com/", "");
                            //console.log(tweet_elem[index].querySelector('[data-testid="User-Name"]  a').href.replace("https://x.com/", ""))
                            //console.log(imp_user_block_list_regexp)
                            //console.log(tweet_elem[index])
                            //console.log(tweet_elem[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_flag"))
                            //tweet_elem[index].setAttribute("cslt_flag", "imp_ok");
                            if(imp_user_block_list_regexp.test(tweet_user_id) && tweet_elem[index].getAttribute("cslt_flag") != "imp_ok"){
                                //console.log("found!");
                                tweet_elem[index].setAttribute("cslt_flag", "imp_ok");
                                //tweet_elem[index].style.background = "#ffecb4";
                                tweet_elem[index].textContent = "";
                            }
                        }
                    }
                }
                //報告・ブロック・ミュート機能で追加されたアカウントを非表示
                if(cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2' || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4'){
                    const csltinfo_complete_tweet_all = document.querySelectorAll('div[data-testid="cellInnerDiv"][cslt_tweet_info]:not([cslt_temp_hide_flag="complete"],[cslt_temp_fail_report_flag="fail_tweet"])');
                    for (let index = 0; index < csltinfo_complete_tweet_all.length; index++) {
                        const analyze_tweet_info = JSON.parse(csltinfo_complete_tweet_all[index].getAttribute("cslt_tweet_info"));
                        //ブロック・ミュート完了フラグ付加
                        if(block_mute_user_ids_regex != null){
                            //console.log(block_mute_user_ids_regex)
                            if(block_mute_user_ids_regex.test(analyze_tweet_info.user_data.user_id)){
                                csltinfo_complete_tweet_all[index].setAttribute("cslt_temp_hide_flag", "complete");
                                csltinfo_complete_tweet_all[index].textContent = "";
                            }
                        }
                        //ツイートのみ報告完了フラグ付加
                        if(report_tweet_status_ids_regex != null){
                            //console.log(report_tweet_status_ids_regex)
                            if(report_tweet_status_ids_regex.test(analyze_tweet_info.tweet_id)){
                                csltinfo_complete_tweet_all[index].setAttribute("cslt_temp_hide_flag", "complete");
                                csltinfo_complete_tweet_all[index].textContent = "";
                            }
                        }
                        //報告失敗アイコン変化&フラグ付加
                        if(fail_report_tweet_status_ids_regex != null){
                            if(fail_report_tweet_status_ids_regex.test(analyze_tweet_info.tweet_id) == true){
                                console.log(fail_report_tweet_status_ids.includes(analyze_tweet_info.tweet_id))
                                console.log(fail_report_tweet_status_ids_regex)
                                if(csltinfo_complete_tweet_all[index].querySelector('a[cslt_report_btn]')?.classList != null){
                                    console.log("ONNN")
                                    csltinfo_complete_tweet_all[index].querySelector('a[cslt_report_btn]').classList.add("cslt_report_fail");
                                    csltinfo_complete_tweet_all[index].setAttribute("cslt_temp_fail_report_flag", "fail_tweet");
                                }
                            }
                        }
                        //ブロック・ミュート失敗アイコン変化&フラグ付加
                        if(fail_block_mute_user_ids_regex != null){
                            if(fail_block_mute_user_ids_regex.test(analyze_tweet_info.user_data.user_id) == true){
                                if(csltinfo_complete_tweet_all[index].querySelector('a[cslt_report_btn]')?.classList != null){
                                    csltinfo_complete_tweet_all[index].querySelector('a[cslt_report_btn]').classList.add("cslt_report_fail");
                                    csltinfo_complete_tweet_all[index].setAttribute("cslt_temp_fail_report_flag", "fail_tweet");
                                }
                            }
                        }
                    }
                }
                //Blueブロック
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
                    //~1.8.8-target_elem '[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[data-testid="User-Name"] svg[data-testid="icon-verified"]'
                    let blue_target_elem = null;
                    if(window.location.pathname.split("/")[4] == 'quotes'){
                        blue_target_elem = document.querySelectorAll('[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[data-testid="User-Name"][id] svg[data-testid="icon-verified"]');
                    }else{
                        blue_target_elem = document.querySelectorAll('[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[data-testid="User-Name"] svg[data-testid="icon-verified"]');
                    }
                    //console.log(blue_target_elem)
                    let all_rep = document.querySelectorAll('[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"]');
                    if(cslp_settings.root_tweetuser_block == true && window.location.pathname.split("/")[4] != 'quotes'){
                        if(document.querySelector('[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[data-testid="User-Name"] a')?.href != null){
                            let root_user = document.querySelector('[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[data-testid="User-Name"] a').href;
                            for (let index = 0; index < all_rep.length; index++) {
                                if(all_rep[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag") != "blue_ok" && typeof all_rep[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]') != "null"){
                                    //console.log(all_rep[index])
                                    if(root_user == all_rep[index].querySelector('div[data-testid="User-Name"] a')?.href){
                                        all_rep[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_blue_flag", "blue_ok")
                                        //console.log(all_rep[index])
                                    }
                                }
                            }
                        }
                    }
                    //console.log(blue_target_elem)
                    switch (cslp_settings.blue_block_mode) {
                        //Blueマーク付を文字数で非表示
                        case "0":
                            //console.log(Number(cslp_settings.blue_block_value_num));
                            for(let index = 0; index <= blue_target_elem.length; index++) {
                                if(typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]')?.getAttribute("cslt_blue_flag") != "undefined"){
                                    if(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag")!= "blue_ok" && typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]') != "null"){
                                        const tweet_text = blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]')?.innerText;
                                        if(tweet_text?.length <= Number(cslp_settings.blue_block_value_num)){
                                            //console.log(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]'));
                                            blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_blue_flag", "blue_ok");
                                            blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').textContent = ``;
                                        }
                                    }
                                }
                            }
                            break;
                        //全ユーザーを文字数で非表示
                        case "1":
                            //console.log(Number(cslp_settings.blue_block_value_num));
                            for(let index = 0; index <= all_rep.length; index++) {
                                //console.log(all_rep[index].closest('[data-testid="cellInnerDiv"]'))
                                if(typeof all_rep[index]?.closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag") != "undefined"){
                                    if(all_rep[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag") != "blue_ok" && typeof all_rep[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]') != "null"){
                                        const tweet_text = all_rep[index].closest('[data-testid="cellInnerDiv"]').querySelector('div[data-testid="tweetText"]')?.innerText;
                                        if(tweet_text?.length <= Number(cslp_settings.blue_block_value_num)){
                                            //console.log(all_rep[index].closest('[data-testid="cellInnerDiv"]'));
                                            all_rep[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_blue_flag", "blue_ok");
                                            all_rep[index].closest('[data-testid="cellInnerDiv"]').textContent = ``;
                                        }
                                    }
                                }
                            }
                            break;
                        //Blueマーク付を全て非表示
                        case "2":

                            for(let index = 0; index < blue_target_elem.length; index++) {
                                if(typeof blue_target_elem[index]?.closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag") != "undefined"){
                                    if(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').getAttribute("cslt_blue_flag")!= "blue_ok"){
                                        //console.log(blue_target_elem[index].closest('[data-testid="cellInnerDiv"]'));
                                        console.log(blue_target_elem[index])
                                        blue_target_elem[index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_blue_flag", "blue_ok");
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
                    if(window.location.pathname.match("\/status\/")?.length == 1){
                        for (let index = 0; index < document.querySelectorAll('[data-testid="tweetText"]').length; index++) {
                            if(cslp_settings.arabic_user_reply_block == true){
                                if(arabic_regexp.test(document.querySelectorAll('[data-testid="tweetText"]')[index].closest('article').querySelector('[data-testid="User-Name"] a').textContent)){
                                    //console.log("arabic_user_delete-"+document.querySelectorAll('[data-testid="tweetText"]')[index].closest('article').querySelector('[data-testid="User-Name"] a').textContent)
                                    let target = document.querySelectorAll('[data-testid="tweetText"]')[index];
                                    target.closest('[data-testid="cellInnerDiv"]').textContent = "";
                                }
                            }
                            if(document.querySelectorAll('[data-testid="tweetText"]')[index]?.innerText != undefined && arabic_regexp.test(document.querySelectorAll('[data-testid="tweetText"]')[index].innerText)){
                                //console.log("arabicdelete-"+document.querySelectorAll('[data-testid="tweetText"]')[index].innerText)
                                let target = document.querySelectorAll('[data-testid="tweetText"]')[index];
                                target.closest('[data-testid="cellInnerDiv"]').textContent = "";
                            }
                        }
                    }
                }
                //報告・ブロック
                function is_timeline_follow_report(){
                    if(cslp_settings.oneclick_report_timeline_disable == true && window.location.pathname.match("\/home")?.length == 1  && document.querySelectorAll('div[data-testid="ScrollSnap-List"] div[role="presentation"] a[role="tab"]')[1]?.getAttribute('aria-selected') == "true"){
                        return true;
                    }else{
                        return false;
                    }
                }
                const is_timeline_report_btn = is_timeline_follow_report();
                if(cslp_settings.oneclick_report == true && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '3' && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '4' && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '5' && cslp_settings.oneclick_developer_report == true && is_timeline_report_btn != true){
                    let reply_elem = null;
                    let is_follow_page = false;
                    let is_community_page = false;
                    if(window.location.pathname.split("/")[2]?.match(/(followers|following|verified_followers)/g)?.length == 1 || window.location.pathname.split("/")[4]?.match(/(retweets|likes)/g)?.length == 1){//window.location.pathname.match(/(\/followers|\/following|\/verified_followers|\/retweets|\/likes)/g)?.length == 1
                        is_follow_page = true;
                    }
                    if(window.location.pathname.split("/")[2] == 'communities'){
                        is_community_page = true;
                    }
                    let login_userid = null;
                    if(document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')?.href != null){
                        login_userid = new URL(document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')?.href)?.pathname.replace("/", "");
                    }
                    if(is_follow_page == true && cslp_settings.oneclick_report_follow_list == true){//cslp_settings.oneclick_report_follow_list == true && is_follow_page == true && window.location.pathname.match(`\/${login_userid}\/`)?.length == 1
                        reply_elem = document.querySelectorAll('div[data-testid="cellInnerDiv"]:not([cslt_flag="report_ok"])');
                    }else{
                        reply_elem = document.querySelectorAll('article[tabindex="0"] div[role="group"]:not([cslt_flag="report_ok"])');
                    }
                    for (let index = 0; index < reply_elem.length; index++) {
                        //<img src="${chrome.runtime.getURL("report_icon.svg")}" style="width: 20px;margin-left: 5px;">
                        const random_id = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
                        if(is_follow_page == true && cslp_settings.oneclick_report_follow_list == true){//is_follow_page == true && cslp_settings.oneclick_report_follow_list == true
                            if(cslp_settings.imp_user_block == true && cslp_settings.follow_list_imp_find_user == true){
                                const follower_user_id = reply_elem[index].querySelector('[data-testid="UserCell"] a[role="link"]')?.href.replace("https://x.com/", "").replace("https://twitter.com", "");
                                if(imp_user_block_list_regexp.test(follower_user_id) && reply_elem[index].querySelector('[data-testid="UserCell"]').getAttribute("cslt_flag") != "follower_imp_ok"){
                                    reply_elem[index].querySelector('[data-testid="UserCell"]').setAttribute("cslt_flag", "follower_imp_ok");
                                    reply_elem[index].querySelector('[data-testid="UserCell"] div[data-testid="userFollowIndicator"]').style.backgroundColor = "#ffb9ad";
                                    reply_elem[index].querySelector('[data-testid="UserCell"] div[data-testid="userFollowIndicator"]').title = "CSLTのインプレフィルターによりスパムとしてマークされています";
                                }else{
                                    reply_elem[index].querySelector('[data-testid="UserCell"]')?.setAttribute("cslt_flag", "follower_imp_ok");
                                }

                            }
                            //console.log(reply_elem[index].querySelector('[data-testid="UserCell"]'))
                            reply_elem[index].querySelector('[data-testid="UserCell"]')?.insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                        }else{
                            reply_elem[index].insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                        }
                        if(reply_elem[index].querySelector(".cslt_report_icon") != null){
                            reply_elem[index].setAttribute("cslt_flag", "report_ok");
                        }
                        //reply_elem[index].setAttribute("cslt_flag", "report_ok");
                        //ツイート情報コピー
                        if(cslp_settings.hit_url_copy == true){
                            //URLコピー用要素追加
                            let tweet_info_copy_ins_html = `<div id="cslt_tweet_info_copy_${random_id}" class="cslt_tweetdata_copy" style="width: 100%;height: 100%;position: absolute;z-index: 100;display: flex;align-items: center;text-align: center;justify-content: center;font-weight:bold;background-color: rgba(0,0,0,0.75);color: #fff;outline:solid 5px #1173ff;outline-offset:-5px;cursor:copy;visibility:hidden;">クリックで情報をコピー</div>`;
                            reply_elem[index].closest('[data-testid="cellInnerDiv"], [data-testid="UserCell"]').insertAdjacentHTML("afterbegin", tweet_info_copy_ins_html);
                            copy_tweet_data(reply_elem[index].closest('[data-testid="cellInnerDiv"], [data-testid="UserCell"]').getAttribute("cslt_tweet_info"), `cslt_tweet_info_copy_${random_id}`);
                        }
                        document.querySelector(`#${random_id}`)?.addEventListener("click", async function(){
                            console.debug('report button clicked')
                            //ログインユーザーID取得
                            const get_cookie_twid = await new Promise((resolve)=>{
                                //console.log('getting twid from cookie')
                                chrome.runtime.sendMessage({message: {mode:"login_userid_get", target:null, host:document.location.host}}, (response)=>{
                                    resolve(decodeURIComponent(response).replace("u=", ""));
                                    //console.log('got twid from cookie')
                                });
                            });
                            //
                            let report_confirm = false;
                            if(cslp_settings.oneclick_report_confirm == true){
                                if(confirm("操作を実行しますか?")){
                                    report_confirm = true;
                                }
                            }else{
                                report_confirm = true;
                            }
                            if(report_confirm == true){
                                const report_srvurl = cslp_settings.oneclick_developer_reportsrv_url;
                                //console.log(random_id);
                                const target_element = this.closest('[data-testid="cellInnerDiv"]');
                                const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                let report_result = false;
                                let block_mute_result = false;
                                let fail_report_success_bm = false;
                                //console.log(get_cookie_twid)
                                console.log(tweet_info)
                                if(get_cookie_twid != tweet_info.user_data.user_id || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4' || cslp_settings.oneclick_report_after_mode == '5'){
                                    if(cslp_settings.oneclick_report == true){
                                        if(Number(cslp_settings.oneclick_report_after_mode) <= 2){
                                            //報告処理
                                            if(is_community_page != true){
                                                //コミュニティ内ではない場合
                                                const report_tweet_run = await new Promise((resolve)=>{
                                                    report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id).then((report_status)=>{
                                                        resolve(report_status);
                                                    });
                                                });
                                                if(report_tweet_run != true){
                                                    this.classList.add("cslt_report_fail");
                                                }else{
                                                    report_result = true;
                                                }
                                            }else{
                                                //コミュニティ内である場合
                                                const report_tweet_run = await new Promise((resolve)=>{
                                                    report_tweet_community(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id).then((report_status)=>{
                                                        resolve(report_status);
                                                    });
                                                });
                                                console.log(report_tweet_run);
                                                if(report_tweet_run != true){
                                                    this.classList.add("cslt_report_fail");
                                                }else{
                                                    report_result = true;
                                                }
                                            }
                                            //報告完了IDを保存
                                            if(is_follow_page == false && report_result == true){
                                                report_ids_temp(tweet_info.tweet_id, "report");
                                            }
                                            //
                                            if(cslp_settings.oneclick_report_after_mode == "1"){
                                                //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                                //console.log(target_element.getAttribute("cslt_tweet_info"));
                                                const mute_tweet_run = await new Promise((resolve)=>{
                                                    mute_user(tweet_info.user_data.user_id).then((report_status)=>{
                                                        resolve(report_status);
                                                    });
                                                });
                                                if(mute_tweet_run != true){
                                                    this.classList.add("cslt_report_fail");
                                                }else{
                                                    block_mute_result = true;
                                                }
                                                //ミュート済ユーザーIDを保存
                                                if(is_follow_page == false && mute_tweet_run == true){
                                                    report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                                }
                                                //
                                            }
                                            if(cslp_settings.oneclick_report_after_mode == "2"){
                                                //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                                //console.log(target_element.getAttribute("cslt_tweet_info"));
                                                const block_user_run = await new Promise((resolve)=>{
                                                    block_user(tweet_info.user_data.user_id).then((resp)=>{
                                                        resolve(resp);
                                                    });
                                                });
                                                if(block_user_run == true){
                                                    block_mute_result = true;
                                                }
                                                console.log(block_user_run)
                                                //ブロック済ユーザーIDを保存
                                                if(is_follow_page == false && block_user_run == true){
                                                    report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                                }
                                                //
                                            }
                                            if(cslp_settings.oneclick_developer_report == true){
                                                //開発者情報提供
                                                if(is_follow_page == false){
                                                    developer_spam_user_share(report_srvurl, target_element);
                                                }
                                            }
                                            //this.classList.add("cslt_report_complete");
                                        }
                                    }
                                    if(cslp_settings.oneclick_report_after_mode == '3'){
                                        if(get_cookie_twid != tweet_info.user_data.user_id){
                                            if(cslp_settings.oneclick_developer_report == true){
                                                //開発者情報提供
                                                if(is_follow_page == false){
                                                    developer_spam_user_share(report_srvurl, target_element);
                                                }
                                            }
                                            //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                            //console.log(target_element.getAttribute("cslt_tweet_info"));
                                            const mute_tweet_run = await new Promise((resolve)=>{
                                                mute_user(tweet_info.user_data.user_id).then((report_status)=>{
                                                    resolve(report_status);
                                                });
                                            });
                                            if(mute_tweet_run != true){
                                                this.classList.add("cslt_report_fail");
                                            }else{
                                                block_mute_result = true;
                                            }
                                            //ミュート済ユーザーIDを保存
                                            if(is_follow_page == false && mute_tweet_run == true){
                                                report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                            }
                                            //
                                        }else{
                                            document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                            cslt_message_display("自身のツイートにこの操作はできません", "error");
                                        }
                                    }
                                    if(cslp_settings.oneclick_report_after_mode == '4'){
                                        if(get_cookie_twid != tweet_info.user_data.user_id){
                                            if(cslp_settings.oneclick_developer_report == true){
                                                //開発者情報提供
                                                if(is_follow_page == false){
                                                    developer_spam_user_share(report_srvurl, target_element);
                                                }
                                            }
                                            //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                            //console.log(target_element.getAttribute("cslt_tweet_info"));
                                            const block_user_run = await new Promise((resolve)=>{
                                                block_user(tweet_info.user_data.user_id).then((resp)=>{
                                                    resolve(resp);
                                                });
                                            });
                                            /*if(block_user_run == true){
                                                block_mute_result = true;
                                            }*/
                                            if(block_user_run != true){
                                                this.classList.add("cslt_report_fail");
                                            }else{
                                                block_mute_result = true;
                                            }
                                            //ブロック済ユーザーIDを保存
                                            if(is_follow_page == false && block_user_run == true){
                                                report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                            }
                                            //
                                        }else{
                                            document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                            cslt_message_display("自身のツイートにこの操作はできません", "error");
                                        }
                                    }
                                    if(cslp_settings.oneclick_developer_report == true && cslp_settings.oneclick_report_after_mode == '5'){
                                        //開発者情報提供
                                        if(get_cookie_twid != tweet_info.user_data.user_id){
                                            //アカウント蓄積
                                            //console.log(imp_account.push(target_element.querySelector('[data-testid="User-Name"]  a').href.replace("https://x.com/", "")));
                                            //console.log(JSON.stringify(imp_account))
                                            if(is_follow_page == false){
                                                developer_spam_user_share(report_srvurl, target_element);
                                            }
                                            //this.classList.add("cslt_report_complete");
                                        }else{
                                            document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                            cslt_message_display("自身のツイートにこの操作はできません", "error");
                                        }
                                    }
                                    //報告は失敗したが、ブロックミュートが成功した場合、一時保存から削除
                                    if(cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2'){
                                        if(report_result == false && block_mute_result == true){
                                            console.log("aaaaaa")
                                            report_ids_temp(tweet_info.tweet_id, "fail_report_delete");
                                            fail_report_success_bm = true;
                                        }
                                    }

                                    //処理後にツイート非表示
                                    if(cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2' || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4'){
                                        if(is_follow_page == false){
                                            if(fail_report_tweet_status_ids_regex != null && fail_report_tweet_status_ids_regex.test(tweet_info.tweet_id) == false && report_result == true || fail_block_mute_user_ids_regex != null && fail_block_mute_user_ids_regex.test(tweet_info.tweet_id) == false && block_mute_result == true || fail_report_success_bm == true){
                                                //console.log(fail_report_tweet_status_ids_regex.test(tweet_info.tweet_id));
                                                if(cslp_settings.oneclick_report == true && cslp_settings.oneclick_report_after_mode == '0'){
                                                    tweet_area_clear(target_element, "report_only");
                                                }else{
                                                    tweet_area_clear(target_element, "mute_block");
                                                }
                                            }
                                        }
                                    }
                                    //this.classList.add("cslt_report_complete");
                                }else{
                                    document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                    cslt_message_display("自身のツイートにこの操作はできません", "error");
                                }
                            }
                        })
                    }
                }
                //TwitterCardではないスパムの場合
                for(let index = 0; index < document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]').length; index++){
                    debug_block_num_text = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
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
                    debug_block_num = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "")+Math.random().toString(32).substring(2);
                    //TwitterCard内にリンク(要素全体)を検出
                    //document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="ltr"], [dir="auto"]')[0]
                    if(document.querySelectorAll('[data-testid="card.wrapper"] + a')[index] != undefined){
                        //ヒットツイート削除設定無効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->阻止
                        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"] + a')[index].textContent) && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
                            //console.log("found!");
                            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
                            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 101%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px 16px 5px 5px;"><p>スパムを検出!<br>ヒットしたURL:${document.querySelectorAll('[data-testid="card.wrapper"] + a')[index].textContent}<br>クリックでツイートを開く</p></div>`;
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
                            copy_url(index, debug_block_num, "tw_card");
                        }
                        //ヒットツイート削除設定有効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->削除
                        if(cslp_settings.hit_del == true && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"] + a')[index].textContent)){
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
                    const get_tw_id_url = new URL(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"]  a[dir="ltr"], div[dir="ltr"] [aria-describedby][role="link"]').href);
                    const get_tw_date = new Date(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"] a[dir="ltr"] time, div[dir="ltr"] [aria-describedby][role="link"] time').getAttribute("datetime"));
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
                            chrome.runtime.sendMessage({message: {mode:"advanced_check", target:tco_addr, host:document.location.host}}, (response) => {
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
                            chrome.runtime.sendMessage({message: {mode:"advanced_check", target:tco_addr, host:document.location.host}}, (response) => {
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
                        //アドバンスド解析ベースモードからのt.coリンク取得部分移植
                        function get_tco_new(input_element){
                            let target_element_a = input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a');
                            let target_url = null;
                            if(input_element.parentElement.querySelectorAll('[data-testid="tweetText"] a').length != 0){
                                target_element_a = input_element.parentElement.querySelectorAll('[data-testid="tweetText"] a');
                            }
                            if(input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a').length != 0){
                                target_element_a = input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a');
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
                            return target_url;
                        }
                        //console.log(get_tco_new(this));
                        //
                        let adv_tco_addr = get_tco_new(this)
                          switch (cslp_settings.hit_url_copy_mode) {
                            case "0":
                                if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                navigator.clipboard.writeText(adv_tco_addr);
                                hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr}\r\n他の拡張機能との競合や広告をコピーした可能性があります。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                } else {
                                get_blockurl(adv_tco_addr).then(function (url) {
                                    navigator.clipboard.writeText(url).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${url}`);
                                    });
                                });
                                }
                                break;
                            case "1":
                                if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                    navigator.clipboard.writeText(adv_tco_addr).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスでコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    navigator.clipboard.writeText(adv_tco_addr).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr}`);
                                    });
                                }
                                break;
                            case "2":
                                if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                    navigator.clipboard.writeText(`${adv_tco_addr},${adv_tco_addr}`).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr},${adv_tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    get_blockurl(adv_tco_addr).then(function (url) {
                                        let cl_text = `${url},${adv_tco_addr}`;
                                        //console.log(cl_text);
                                        navigator.clipboard.writeText(cl_text).then(()=>{
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${cl_text}`);
                                        });
                                    })
                                }
                                break;
                            case "3":
                                if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                    //navigator.clipboard.writeText(`${tco_addr},${tco_addr}`);
                                    //hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${tco_addr},${tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。`);
                                    copy_t_co_addr = adv_tco_addr;
                                    copy_base_addr = adv_tco_addr;
                                    const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                    navigator.clipboard.writeText(copy_text).then(()=>{
                                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                    });
                                } else {
                                    get_blockurl(adv_tco_addr).then(function (url) {
                                        //let cl_text = `${url},${adv_tco_addr}`;
                                        //console.log(cl_text);
                                        //navigator.clipboard.writeText(cl_text);
                                        //hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${cl_text}`);
                                        copy_t_co_addr = adv_tco_addr;
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
            function copy_tweet_data(element_json, target_id){
                document.querySelector(`#${target_id}`).addEventListener("click", function(){
                    const copy_obj = JSON.parse(element_json);
                    delete copy_obj.report_json;
                    const copy_json = JSON.stringify(copy_obj);
                    navigator.clipboard.writeText(copy_json).then(()=>{
                        console.log(copy_json)
                        cslt_message_display("クリップボードにJSONをコピーしました", "message");
                    });
                });
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
                chrome.runtime.sendMessage({message: {mode:"blue_check", target:user_name, host:document.location.host}}, (response) => {
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

//報告関数
async function report_tweet(report_mode, report_element, report_twid, last_report_status){
    console.debug('function report_tweet launched')
    //report_target_elem.querySelector('[aria-haspopup="menu"][data-testid="caret"]').click();
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const report_mode_conv = Number(report_mode);
    const tweet_info_obj = JSON.parse(report_element.getAttribute("cslt_tweet_info"));
    //console.log(tweet_info_obj)
    const report_json_obj = JSON.parse(tweet_info_obj.report_json);
    const report_req_obj = JSON.parse(report_json_obj.input_flow_data.requested_variant);
    const report_first_json_body = tweet_info_obj.report_json.replaceAll("%cslt_random_uuid%", crypto.randomUUID());
    //console.log(report_req_obj)
    //プロモーションの場合関数終了
    if(report_req_obj.is_promoted == true){
        cslt_message_display(`広告のため報告はスキップされます`, "warning");
        return true;
    }
    const get_ct0_token = await new Promise((resolve)=>{
        ct0_token_get().then( async function(ct0_token){
            resolve(ct0_token);
        });
    });
    //報告送信関数
    async function send_second_report(response_obj){
        const get_csrf_token = await new Promise((resolve)=>{
            ct0_token_get().then((response)=>{
                resolve(response);
            });
        });
        return new Promise((resolve)=>{
            let now_steps = 1;
            let report_finalize = false;
            send_srv(response_obj);
            function send_srv(input_response){
                const input_token_convert = decodeURIComponent(input_response.flow_token).replaceAll("=", "");
                let report_second_stage_body =null;
                if(now_steps == 1){
                    report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"single-selection\",\"choice_selection\":{\"link\":\"next_link\",\"selected_choices\":[\"${input_response.subtasks[0].choice_selection.choices[report_mode_conv].id}\"]}}]}`;
                }else{
                    if(report_finalize != true){
                        const choice_def = [4, 5, 2, null, null, null, null, 0, null, null];
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"single-selection\",\"choice_selection\":{\"link\":\"next_link\",\"selected_choices\":[\"${input_response.subtasks[0].choice_selection.choices[choice_def[report_mode_conv]].id}\"]}}]}`;
                    }else{
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"${input_response.subtasks[0].subtask_id}\",\"settings_list\":{\"setting_responses\":[],\"link\":\"next_link\"}}]}`;
                    }
                }
                fetch(`https://${document.location.host}/i/api/1.1/report/flow.json`, {
                headers: {
                    "authorization": public_bearer_token,
                    "content-type": "application/json",
                    "x-csrf-token": get_csrf_token,
                    "X-Twitter-Active-User": "yes",
                    "X-Twitter-Auth-Type": "OAuth2Session",
                    "X-Twitter-Client-Language": "ja",
                    "X-Client-Transaction-Id": ctid_create()
                },
                "referrer": `https://${document.location.host}/i/safety/report_story_start`,
                "body": report_second_stage_body,
                "method": "POST"
            }).then(response => {
                if (response.status != 200) {
                    if(response.status == 429){
                        cslt_message_display(`通報の${now_steps}ステップ目失敗(レートリミット)`, "error");
                        console.error(response.status);
                        resolve(false);
                        //throw new Error(response.status);
                    }else{
                        cslt_message_display(`通報の${now_steps}ステップ目失敗(Res:${response.status})`, "error");
                        console.error(response.status);
                        resolve(false);
                        //throw new Error(response.status);
                    }
                }else{
                    cslt_message_display(`通報の${now_steps}ステップ目成功(Res:${response.status})`, "message");
                    return response.json();
                }
            }).then((resp_json_secondstep)=>{
                now_steps += 1;
                if(resp_json_secondstep.subtasks[0].progress_indication.percentage_complete != 100){
                    send_srv(resp_json_secondstep);
                }else{
                    if(report_finalize == false){
                        report_finalize = true;
                        send_srv(resp_json_secondstep);
                    }else{
                        cslt_message_display(`通報の最終ステップ成功`, "message");
                        if(fail_report_tweet_status_ids_regex != null && fail_report_tweet_status_ids_regex.test(report_twid) == true){
                            report_ids_temp(report_twid, "fail_report_delete");
                        }
                        resolve(true);
                    }
                }
            }).catch(error =>{
                console.log("Report 2nd stage error");
                cslt_message_display(`通報の${now_steps}ステップ目失敗(${error.message})`, "error");
                report_ids_temp(report_twid, "fail_report");
                console.log(error);
            });
            }
        });
    }
    //ct0トークン取得後初期実行
    const first_report = new Promise((resolve)=>{
        fetch(`https://${document.location.host}/i/api/1.1/report/flow.json?flow_name=report-flow`, {
            headers: {
                "authorization": public_bearer_token,
                "content-type": "application/json",
                "x-csrf-token": get_ct0_token,
                "X-Twitter-Active-User": "yes",
                "X-Twitter-Auth-Type": "OAuth2Session",
                "X-Twitter-Client-Language": "ja",
                "X-Client-Transaction-Id": ctid_create()
            },
            "referrer": `https://${document.location.host}/i/safety/report_story_start`,
            "body": report_first_json_body,
        "method": "POST"
        }).then(response => {
            if (response.status != 200) {
                if(response.status == 429){
                    cslt_message_display(`通報の初期ステップ失敗(レートリミット)`, "error");
                    throw new Error(response.status);
                }else{
                    cslt_message_display(`通報の初期ステップ失敗(Res:${response.status})`, "error");
                    throw new Error(response.status);
                }
            }else{
                cslt_message_display(`通報の初期ステップ成功(Res:${response.status})`, "message");
                return response.json();
            }
        }).then((resp_json_firststep)=>{
            //2ステップ
            send_second_report(resp_json_firststep).then((res)=>{
                //console.log(res)
                resolve(res);
            });
        }).catch(error =>{
            console.log("Report 1st stage error");
            cslt_message_display(`通報の初期ステップ失敗(${error.message})`, "error");
            report_ids_temp(report_twid, "fail_report");
            resolve(false);
            console.log(error);
        });
    });
    return first_report;
}
//報告関数(コミュニティ)
function report_tweet_community(report_mode, report_element, report_twid, last_report_status){
    const report_mode_conv = Number(report_mode);
    let report_mode_str_first = null;
    let report_mode_str_second = null;
    const tweet_info_obj = JSON.parse(report_element.getAttribute("cslt_tweet_info"));;
    const report_first_param_body = tweet_info_obj.report_param.replaceAll("%cslt_random_uuid%", crypto.randomUUID());
    let old_send_url = `https://${document.location.host}/i/report/status/${report_twid}`;
    //プロモーションの場合関数終了
    if(tweet_info_obj.is_promoted == true){
        cslt_message_display(`広告のため報告はスキップされます`, "warning");
        return true;
    }
    switch (report_mode_conv) {
        case 5:
            report_mode_str_first = "SpamOption";
            report_mode_str_second = "SpamSomethingElseOption";
            break;
        default:
            report_mode_str_first = "AbuseOption";
            report_mode_str_second = "OffensiveOption";
            break;
    }
    //報告2回目以降送信関数
    async function send_second_report(response_obj){
        return new Promise((resolve)=>{
            const first_step_resp_html = new DOMParser().parseFromString(response_obj, "text/html");
            let now_steps = 1;
            let report_finalize = false;

            send_srv(response_obj);
            function send_srv(input_response){
                const second_step_resp_html = new DOMParser().parseFromString(input_response, "text/html");
                let send_url_param = "";
                let send_body = null;
                let send_method = "GET";
                let send_content_type = null;
                //送信項目case毎に動作シナリオ
                switch (now_steps) {
                    case 1:
                        send_url_param = `?report_flow_state=${first_step_resp_html.querySelector('input[name="report_flow_state"]').value}&lang=${first_step_resp_html.querySelector('input[name="lang"]').value}&is_mobile=${first_step_resp_html.querySelector('input[name="is_mobile"]').value}&next_view=true&selected_option=${report_mode_str_first}`;
                        send_body = null;
                        send_method = "GET";
                        send_content_type = null;
                        break;
                    case 2:
                        send_body = `authenticity_token=${second_step_resp_html.querySelector('input[name="authenticity_token"]').value}&context=&report_flow_state=${second_step_resp_html.querySelector('input[name="report_flow_state"]').value}&lang=${second_step_resp_html.querySelector('input[name="lang"]').value}&is_mobile=${second_step_resp_html.querySelector('input[name="is_mobile"]').value}&selected_option=${report_mode_str_second}`;
                        send_method = "POST";
                        send_content_type = "application/x-www-form-urlencoded";
                        break;
                    /*case 3:
                    //最終ステップはリダイレクトするので無視
                        send_url_param = `_complete?report_flow_state=${second_step_resp_html.querySelector('input[name="report_flow_state"]').value}&lang=${second_step_resp_html.querySelector('input[name="lang"]').value}&report_type=spam`;
                        send_body = null;
                        send_method = "GET";
                        send_content_type = null;
                        break;*/
                    default:
                        break;
                }
                fetch(`https://${document.location.host}/i/safety/report_story${send_url_param}`, {
                    headers: {
                        "cache-control": "no-cache",
                        "sec-fetch-dest": "iframe",
                        "sec-fetch-mode": "navigate",
                        "content-type": send_content_type
                    },
                    "referrer": old_send_url,
                    "body": send_body,
                    "method": send_method,
                    "mode": "cors",
                    "credentials": "include"
                }).then(response => {
                    if (response.status != 200 && response.status != 302) {
                        if(response.status == 429){
                            cslt_message_display(`通報の${now_steps}ステップ目失敗(コミュニティ/レートリミット)`, "error");
                            console.error(response.status);
                            resolve(false);
                        }else{
                            cslt_message_display(`通報の${now_steps}ステップ目失敗(コミュニティ/Res:${response.status})`, "error");
                            console.error(response.status);
                            resolve(false);
                        }
                    }else{
                        old_send_url = response.url;
                        cslt_message_display(`通報の${now_steps}ステップ目成功(コミュニティ/Res:${response.status})`, "message");
                        return response.text();
                    }
                }).then((resp_text_firststep)=>{
                    //次ステップへ
                    if(now_steps != 2){
                        now_steps += 1;
                        send_srv(resp_text_firststep);
                    }else{
                        //console.log("community report end!");
                        cslt_message_display(`通報の最終ステップ成功(コミュニティ)`, "message");
                        if(fail_report_tweet_status_ids_regex != null && fail_report_tweet_status_ids_regex.test(report_twid) == true){
                            report_ids_temp(report_twid, "fail_report_delete");
                        }
                        resolve(true);
                    }
                }).catch(error =>{
                    console.log("Community Report 2nd stage error");
                    report_ids_temp(report_twid, "fail_report");
                    cslt_message_display(`通報の${now_steps}ステップ目失敗(コミュニティ/${error.message})`, "error");
                    resolve(false);
                    console.log(error);
                });
            }
        });
    }
    const first_report = new Promise((resolve)=>{
        fetch(`https://${document.location.host}/i/safety/report_story?${report_first_param_body}`, {
            headers: {
                "cache-control": "no-cache",
                "sec-fetch-dest": "iframe",
                "sec-fetch-mode": "navigate"
            },
            "referrer": old_send_url,
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(response => {
            console.log(response.ok)
            if (response.status != 200) {
                if(response.status == 429){
                    cslt_message_display(`通報の初期ステップ失敗(コミュニティ/レートリミット)`, "error");
                    throw new Error(response.status);
                }else{
                    cslt_message_display(`通報の初期ステップ失敗(コミュニティ/Res:${response.status})`, "error");
                    throw new Error(response.status);
                }
            }else{
                old_send_url = response.url;
                cslt_message_display(`通報の初期ステップ成功(コミュニティ/Res:${response.status})`, "message");
                return response.text();
            }
        }).then((resp_text_firststep)=>{
            //2ステップ
            send_second_report(resp_text_firststep).then((res)=>{
                console.log(res)
                resolve(res);
            });
        }).catch(error =>{
            console.log("Community Report 1st stage error");
            cslt_message_display(`通報の初期ステップ失敗(コミュニティ/${error.message})`, "error");
            report_ids_temp(report_twid, "fail_report");
            resolve(false);
            console.log(error);
        });
    });
    return first_report;
}
//ブロック関数(API直接)
async function block_user(user_id){
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const run_block = await new Promise((resolve)=>{
        ct0_token_get().then(function(ct0_token){
            let csrf_token = ct0_token;
            fetch(`https://${document.location.host}/i/api/1.1/blocks/create.json`, {
                method:"POST",
                headers: {
                    "authorization": public_bearer_token,
                    "X-Csrf-Token": csrf_token,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    "X-Client-Transaction-Id": ctid_create(),
                    "X-Twitter-Active-User": "yes",
                    "X-Twitter-Auth-Type": "OAuth2Session",
                    "X-Twitter-Client-Language": "ja"
                },
                body: encodeURI(`user_id=${user_id}`)
            }).then((resp)=>{
                if(resp.status != 200){
                    if(resp.status == 429){
                        cslt_message_display("ブロックできません(レートリミット)", "error");
                    }
                    throw new Error(resp.status);
                }else{
                    cslt_message_display("ブロックしました", "message");
                    if(fail_block_mute_user_ids_regex != null && fail_block_mute_user_ids_regex.test(user_id) == true){
                        report_ids_temp(user_id, "fail_block_mute_delete");
                        console.log(fail_block_mute_user_ids)
                    }
                    return resp.json();
                }
            }).then((json)=>{
                //console.log(json);
                resolve(true);
            }).catch(error =>{
                console.log("fail block");
                console.log(error);
                report_ids_temp(user_id, "fail_block_mute");
                cslt_message_display(`ブロックできません(${error.message})`, "error");
                resolve(false);
            });
        });
    });
    return run_block;
}
//ミュート関数(API直接)
async function mute_user(user_id){
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const run_mute = await new Promise((resolve)=>{
        ct0_token_get().then(function(ct0_token){
            let csrf_token = ct0_token;
            fetch(`https://${document.location.host}/i/api/1.1/mutes/users/create.json`, {
                method:"POST",
                headers: {
                    "authorization": public_bearer_token,
                    "X-Csrf-Token": csrf_token,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    "X-Twitter-Active-User": "yes",
                    "X-Twitter-Auth-Type": "OAuth2Session",
                    "X-Twitter-Client-Language": "ja",
                    "X-Client-Transaction-Id": ctid_create()
                },
                body: encodeURI(`user_id=${user_id}`)
            }).then((resp)=>{
                if(resp.status != 200){
                    if(resp.status == 429){
                        cslt_message_display("ミュートできません(レートリミット)", "error");
                    }
                    throw new Error(resp.status);
                }else{
                    cslt_message_display("ミュートしました", "message");
                    if(fail_block_mute_user_ids_regex != null && fail_block_mute_user_ids_regex.test(user_id) == true){
                        report_ids_temp(user_id, "fail_block_mute_delete");
                    }
                    return resp.json();
                }
            }).then((json)=>{
                //console.log(json);
                resolve(true);
            }).catch(error =>{
                console.log("fail mute");
                console.log(error);
                report_ids_temp(user_id, "fail_block_mute");
                cslt_message_display(`ミュートできません(${error.message})`, "error");
                resolve(false);
            });
        });
    });
    return run_mute;
}
//開発者提供用関数
function developer_spam_user_share(report_srv, spam_element){
    let tweet_user_id = null;
    let tweet_uesr_name = null;
    let tweet_text = null;
    let tweet_text_length = null;
    tweet_user_id = spam_element.querySelector('[data-testid="User-Name"]  a').href.replace("https://x.com/", "").replace("https://twitter.com/", "");
    tweet_uesr_name = spam_element.querySelector('article [data-testid="User-Name"] a').textContent;
    tweet_text = `${spam_element.querySelector('article[data-testid="tweet"] [aria-labelledby]')?.innerText}%and%${spam_element.querySelector('[aria-labelledby] div[data-testid="tweetText"]')?.innerText}`;
    tweet_text_length = tweet_text.length;
    //console.log({tweet_user_id:tweet_user_id, tweet_user_name:tweet_uesr_name, tweet_text:tweet_text, tweet_length:tweet_text_length})
    chrome.runtime.sendMessage({message: {mode:"developer_report_share", target:{report_srv_url:report_srv, tweet_user_id:tweet_user_id, tweet_user_name:tweet_uesr_name, tweet_text:tweet_text, tweet_length:tweet_text_length}, host:document.location.host}}, (response) => {});
}
//ユーザーメッセージ表示関数
async function cslt_message_display(message, mode){
    new Promise(()=>{
        document.querySelector(".cslt_message_wrap").style.display = "flex";
        document.querySelector(".cslt_message_span").textContent = message;
        switch (mode) {
            case "warning":
                document.querySelector(".cslt_message_content").style.backgroundColor = "#f0721d";
                break;
            case "error":
                document.querySelector(".cslt_message_content").style.backgroundColor = "#f01d47";
                break;

            default:
                document.querySelector(".cslt_message_content").style.backgroundColor = "#1d9bf0";
                break;
        }
        setTimeout(function(){
            document.querySelector(".cslt_message_wrap").style.display = "none";
        }, 5000);
    });
}
async function tweet_area_clear(target_element, mode){
    new Promise(()=>{
        const target_tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
        const target_tweet_id = target_tweet_info.tweet_id;
        const target_tweet_user_id = target_tweet_info.user_data.user_id;
        switch (mode) {
            case "report_only":
                target_element.setAttribute("cslt_temp_hide_flag", "complete");
                target_element.textContent = "";
                break;
            case "mute_block":
                const target_other_tweet_all = document.querySelectorAll('div[data-testid="cellInnerDiv"][cslt_tweet_info]:not([cslt_temp_hide_flag="complete"])');
                for (let index = 0; index < target_other_tweet_all.length; index++) {
                    const all_target_tweet_info = JSON.parse(target_other_tweet_all[index].getAttribute("cslt_tweet_info"));
                    //console.log(all_target_tweet_info)
                    if(all_target_tweet_info.user_data.user_id == target_tweet_user_id){
                        target_element.setAttribute("cslt_temp_hide_flag", "complete");
                        target_other_tweet_all[index].textContent = "";
                    }
                }
                break;
            default:
                break;
        }
    });
}
function ctid_create(){
    return btoa(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(70)))).replaceAll("=", "");
}
function ct0_token_get(){
    return new Promise((resolve)=>{
        const is_private_mode = chrome.extension.inIncognitoContext;
        if(is_private_mode){
            const doc_cookie_ct0 = document.cookie.match(/(?<=ct0=)(.*?)(?=;)/g);
            resolve(doc_cookie_ct0);
        }else{
            chrome.runtime.sendMessage({message: {mode:"ct0_token_get", target:null, host:document.location.host}}, (response) => {
                resolve(response);
            });
        }
    })
}
