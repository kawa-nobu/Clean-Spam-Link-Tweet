//const cslt_performance_logging = [];
//let imp_account = new Array();
let block_list;
let block_regexp;
let imp_user_block_list_regexp;
//\u0600-\u060f\u0610-\u061f\u0620-\u062f\u0630-\u063f\u0640-\u064f\u0650-\u065f\u0660-\u066f\u0670-\u067f\u0680-\u068f\u0690-\u069f\u06a0-\u06af\u06b0-\u06bf\u06c0-\u06cf\u06d0-\u06df\u06e0-\u06ef\u06f0-\u06ff
//アラビア文字&デーヴァナーガリー文字(&拡張)
const hide_text_regexp = { arabic: "\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff", devanagari: "\u0900-\u097f\ua8e0-\ua8ff", tamil: "\u0B80-\u0BFF\u11FC-\u11FF", english: "^[A-Za-z0-9\\s.,!?\"'@#$%&*()_+\\-=\\[\\]{};:\\\\|<>\\/\\?~`^’]+$" };
//絵文字正規表現
const emoji_text_regexp = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]+$/u;
let arabic_regexp;//new RegExp("[\u0600-\u06ff\u0900-\u097f\ua8e0-\ua8ff]")
let advanced_regexp;
let reprint_manga_spam_regexp;
let look_profile_spam_regexp;
let affiliate_url_regexp;
let affiliate_text_regexp;
let affiliate_user_text_regexp;
let amazon_link_regexp;
let auto_tweet_tools_client_name_regexp;
let user_blocking_word_list_regexp;
let scam_induction_spam_block_regexp;
let scam_induction_spam_user_text_regexp = null;
let scam_induction_spam_user_block_regexp;
let hide_user_list_regexp;
let user_whitelist_regexp;
let cslt_exclusion_css_flag;
let s_key_down = null;
let debug_block_num_text = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "") + Math.random().toString(32).substring(2);
let debug_block_num = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "") + Math.random().toString(32).substring(2);
let shift_key_status = 0;
let l_key_status = 0;
//ホスト検出用
const tw_host = location.host;
//ユーザーページ比較用
let old_user_page_name = null;
//ブロック・ミュートツイートID格納
let block_mute_user_ids = [];
let block_mute_user_ids_regex = /a^/;
//報告ツイートID格納
let report_tweet_status_ids = [];
let report_tweet_status_ids_regex = /a^/;
//報告失敗ツイートID格納
let fail_report_tweet_status_ids = [];
let fail_report_tweet_status_ids_regex = /a^/;
//ブロック・ミュート失敗ID格納
let fail_block_mute_user_ids = [];
let fail_block_mute_user_ids_regex = /a^/;
//新クライアント検出フラグ
let is_new_client = false;

//報告情報一時保管関数
function report_ids_temp(id, mode) {
    if (id == null || id == undefined) {
        return false;
    }
    switch (mode) {
        case "block_mute":
            //ブロック済ユーザーIDを保存
            block_mute_user_ids.push(id);
            block_mute_user_ids_regex = new RegExp(block_mute_user_ids.join('|'), 'g');
            return true;
        case "report":
            //報告完了後のIDを保存
            report_tweet_status_ids.push(id);
            report_tweet_status_ids_regex = new RegExp(report_tweet_status_ids.join('|'), 'g');
            return true;
        case "fail_report":
            //報告完了IDを保存
            if (fail_report_tweet_status_ids.includes(id) != true) {
                fail_report_tweet_status_ids.push(id);
                fail_report_tweet_status_ids_regex = new RegExp(fail_report_tweet_status_ids.join('|'), 'g');
                return true;
            } else {
                return false;
            }
        case "fail_report_delete":
            //報告完了IDを削除
            fail_report_tweet_status_ids.filter(function (imp) { return imp != id });
            fail_report_tweet_status_ids_regex = new RegExp(fail_report_tweet_status_ids.join('|'), 'g');
            return true;
        case "fail_block_mute":
            if (fail_block_mute_user_ids.includes(id) != true) {
                fail_block_mute_user_ids.push(id);
                fail_block_mute_user_ids_regex = new RegExp(fail_block_mute_user_ids.join('|'), 'g');
                return true;
            } else {
                return false;
            }
        case "fail_block_mute_delete":
            fail_block_mute_user_ids.filter(function (imp) { return imp != id });
            fail_block_mute_user_ids_regex = new RegExp(fail_block_mute_user_ids.join('|'), 'g');
            return true;
        default:
            return false;
    }
}
//Apple系ブラウザ判定
function is_apple_device() {
    if (new RegExp('(iPhone|iPad|Macintosh)', 'g').test(navigator.userAgent)) {
        return true;
    } else {
        return false;
    }
}
//ブラウザ判定
function is_use_cookie_mode() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Edg/") || userAgent.includes("OPR/") || userAgent.includes("Chrome/") || userAgent.includes("Chromium/") || userAgent.includes("CriOS")) {
        return false;
    } else if (userAgent.includes("Firefox/") || userAgent.includes("FxiOS")) {
        return true;
    } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && !userAgent.includes("Chromium/")) {
        return true;
    } else {
        return true;
    }
}
//汎用ランダムID作成
function generate_random_id() {
    return Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "") + Math.random().toString(32).substring(2);
}
//CSS&新ツイート解析スクリプト挿入
document.head.insertAdjacentHTML("beforeend", `
<style cslt_css>
.cslt_spam_link_found{
    font-family: system-ui;
}
.cslt_report_icon{
    display: block;
    background:url(${chrome.runtime.getURL("report_icon.svg")});
    background-repeat: no-repeat;
    margin-left: 5px;
}
.cslt_report_icon:hover{
    filter: invert(13%) sepia(89%) saturate(6665%) hue-rotate(343deg) brightness(95%) contrast(106%);
}
.cslt_report_complete{
    filter: invert(76%) sepia(20%) saturate(2691%) hue-rotate(66deg) brightness(102%) contrast(97%);
}
.cslt_report_user_page{
    display: flex;
    width: 34px;
    height: 34px;
    align-items: center;
    align-content: center;
    justify-content: center;
    margin-bottom: 12px;
    margin-right: 10px;
    border: solid 1px rgb(207, 217, 222);
    border-radius: 100px;
}
.cslt_report_user_page .cslt_report_icon{
    margin-left: 0;
    background:url(${chrome.runtime.getURL("report_icon.svg")});
    background-repeat: no-repeat;
}
.cslt_report_user_page:hover{
    filter: invert(13%) sepia(89%) saturate(6665%) hue-rotate(343deg) brightness(95%) contrast(106%);
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
.cslt_block_mute_list_func_btn{
    display: flex;
    height: 3rem;
    width: 15rem;
    font-size: 0.9rem;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-radius: 100px;
    cursor: pointer;
    margin: 0.9rem;
    border: solid 1px rgb(207, 217, 222);
    font-family: system-ui;
    padding: 0 0.3rem;
}
.cslt_block_mute_list_func_btn:hover{
    background: rgb(207, 217, 222);
}
.cslt_block_mute_io_btn_wrap{
    display: flex;
    flex-direction: row;
    justify-content: center;
}
.cslt_userlist_data_input{
    display: none;
}
.cslt_report_icon_tweetmore_wrap{
    margin: 13px 0 0 2%;
}
.cslt_report_icon_notification_wrap{
    display: flex;
    flex-direction: row;
    margin: 13px 0 0 2%;
}
.cslt_report_icon_notification_wrap .cslt_report_icon{
    margin-left: 10px;
}
</style>
`);

//新クライアント向け情報抽出スクリプト
const new_tweet_info_script = document.createElement('script');
new_tweet_info_script.src = chrome.runtime.getURL("cslt_tweet_ctrl_relay.js");
document.head.appendChild(new_tweet_info_script);

//従来の情報抽出スクリプト
const tweet_info_script = document.createElement('script');
tweet_info_script.src = chrome.runtime.getURL("cslt_tweet_ctrl.js");
document.head.appendChild(tweet_info_script);

//メッセージパネル初期化
const systemMessagePanel = cslt_message_display_init();
//
chrome.storage.local.get("cslp_settings", function (value) {
    if (value.cslp_settings != undefined) {
        if (JSON.parse(value.cslp_settings).filter_latest == true) {
            main("https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/filter.json", "https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/imp_filter.json");
        } else {
            main(chrome.runtime.getURL("filter.json"), chrome.runtime.getURL("imp_filter.json"));
        }
    } else {
        main(chrome.runtime.getURL("filter.json"), chrome.runtime.getURL("imp_filter.json"));
    }
});
function main(filter_url, imp_filter_url) {
    console.log("Clean-Spam-Link-Tweet is Working!");
    if (filter_url == "https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@main/filter.json") {
        console.log(`Use Official Online List:${filter_url}`);
    } else {
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
    }).catch(error => {
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
        }).catch(error => {
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
        //ユーザーページユーザー情報キャッシュ
        let old_user_page_user_data_obj = null;
        //設定
        let cslp_settings = null;
        chrome.storage.local.get("cslp_settings", function (value) {
            let cslp_update_flag = null;
            if (value.cslp_settings != undefined) {
                if (JSON.parse(value.cslp_settings).version != chrome.runtime.getManifest().version) {
                    console.log(JSON.parse(value.cslp_settings))
                    console.log("New version");
                    cslp_update_flag = true;
                } else {
                    cslp_update_flag = false;
                }
            }
            //設定作成&更新関数
            function settings_update(input_setting) {
                const cslp_default_settings = {
                    filter: true,
                    night_spam_block: true,
                    hit_del: false,
                    disable_hit: false,
                    amazon_hit: false,
                    filter_latest: true,
                    hit_url_copy: false,
                    short_url_hit_disable: false,
                    hit_url_copy_mode: "0",
                    hit_url_copy_user_text: "%t_co%,%bl_url%,%adv_addr%,%tw_id%,%tw_date%",
                    hit_url_copy_advanced: false,
                    hit_url_copy_advanced_filter: false,
                    blue_block: false,
                    imp_user_block: false,
                    follow_list_imp_find_user: false,
                    root_tweetuser_block: true,
                    blue_block_value_num: "10",
                    blue_block_mode: "0",
                    arabic_reply_block: false,
                    arabic_reply_block_lang: { arabic: true, devanagari: true, tamil: true, english: false },
                    arabic_user_reply_block: false,
                    arabic_user_profile_text_block: false,
                    hide_emoji_text: true,
                    short_video_block: false,
                    short_video_block_ms: "2000",
                    short_video_block_disable_tl: true,
                    animated_gif_block: false,
                    version: chrome.runtime.getManifest().version,
                    filter_update: json[0].developer_update,
                    filter_link: json[0].thanks_link,
                    filter_thanks: json[0].thanks_name,
                    oneclick_report: false,
                    oneclick_report_btn_size: "0",
                    oneclick_report_btn_all_users:true,
                    oneclick_report_btn_set_tweetmore: false,
                    oneclick_report_follow_list: true,
                    oneclick_report_confirm: false,
                    oneclick_report_timeline_disable: false,
                    oneclick_report_target_mode: "0",
                    oneclick_report_after_mode: "0",
                    oneclick_report_option: "6",
                    oneclick_report_notification_page_disable: false,
                    oneclick_report_add_cslt_hideuser: false,
                    oneclick_developer_report: false,
                    oneclick_developer_reportsrv_url: "kwdev-sys.com/api/cslt/imp_report_sys/pub_reporter/",
                    imp_filter_update: "No loading",
                    imp_filter_block_all_area: false,
                    look_profile_spam_block: false,
                    reprint_manga_spam_block: false,
                    reprint_manga_spam_block_strict: false,
                    reprint_manga_spam_block_root_user_disable: true,
                    reprint_manga_spam_area_option: "0",
                    affiliate_spam_block: false,
                    affiliate_spam_block_strict: false,
                    affiliate_spam_area_option: "0",
                    grok_called_response_block: false,
                    grok_share_block: false,
                    scam_induction_spam_block: false,
                    following_user_exclusion: true,
                    user_register_word_hide_profile: false,
                    user_register_word_list: "",
                    user_register_whitelist: [],
                    user_register_hideuser: [],
                    block_advertising_flag: false,
                    block_advertising_flag_on_quoted_post: false,
                    block_ai_generated_flag: false,
                    block_ai_generated_flag_on_quoted_post: false,
                    tw_for_adv_block: false,
                    register_word_regexp_mode:false,
                    promotion_hide: false,
                    blank_profile_hide: false,
                    blocked_by_hide: false,
                    recent_created_account_hide: false,
                    user_hide_words_profile_hide: false,
                    recent_created_account_hide_range: "1",
                    auto_tweet_tools_tweet_block: false
                };
                if (input_setting.cslp_settings != undefined) {
                    let settings_array = new Object();
                    for (let index = 0; index < Object.keys(cslp_default_settings).length; index++) {
                        if (Object.keys(cslp_default_settings)[index] in JSON.parse(input_setting.cslp_settings) == true) {
                            if (Object.keys(cslp_default_settings)[index] == "version") {
                                console.log("設定データのバージョンを更新します")
                                settings_array[Object.keys(cslp_default_settings)[index]] = chrome.runtime.getManifest().version;
                            } else {
                                console.log(`引継ぎ=>[${Object.keys(cslp_default_settings)[index]}]=${JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]]}`);
                                settings_array[Object.keys(cslp_default_settings)[index]] = JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]];
                                //報告オプション未対応置き換え
                                if (Object.keys(cslp_default_settings)[index] == 'oneclick_report_option') {
                                    /* 報告オプション置き換え */
                                    const option_data = JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]];
                                    const reportValueMap = {
                                        0: 0,
                                        1: 1,
                                        2: 2,
                                        3: 6,
                                        4: 6,
                                        5: 6,
                                        6: 6,
                                        7: 8,
                                        8: 6,
                                        9: 10,
                                    };
                                    console.log("報告オプションを置き換えました")
                                    settings_array[Object.keys(cslp_default_settings)[index]] = String(reportValueMap[option_data]);
                                }
                                if (Object.keys(cslp_default_settings)[index] == 'arabic_reply_block_lang') {
                                    /* アラビア文字等項目同期 */
                                    console.log("アラビア文字等設定項目同期開始")
                                    const option_data = JSON.parse(input_setting.cslp_settings)[Object.keys(cslp_default_settings)[index]];
                                    Object.keys(cslp_default_settings.arabic_reply_block_lang).forEach((lang) => {
                                        if (option_data[lang] != undefined) {
                                            settings_array.arabic_reply_block_lang[lang] = option_data[lang];
                                        } else {
                                            settings_array.arabic_reply_block_lang[lang] = cslp_default_settings.arabic_reply_block_lang[lang];
                                        }
                                    })
                                }
                                //
                            }
                        } else {
                            console.log(`新規の設定項目を作成=>[${Object.keys(cslp_default_settings)[index]}]`);
                            settings_array[Object.keys(cslp_default_settings)[index]] = cslp_default_settings[Object.keys(cslp_default_settings)[index]];
                        }
                    }
                    //console.log(settings_array);
                    return settings_array;
                } else {
                    return cslp_default_settings;
                }
            }
            //
            cslp_settings = value;
            if (value.cslp_settings == undefined || cslp_update_flag == true) {
                console.group("Initializing CSLT Settings...");
                const new_settings = settings_update(value);
                cslp_settings = new_settings;
                //console.log({'cslp_settings': JSON.stringify(cslp_settings)})
                chrome.storage.local.set({ 'cslp_settings': JSON.stringify(cslp_settings) }, function () {
                    console.group(`Initialize Complete!`);
                    console.dir(cslp_settings);
                    console.groupEnd();
                    if (cslp_update_flag == true) {
                        alert("Clean-Spam-Link-Tweetバージョンが更新されました！\r\nTwitterの再読み込みを行ってください。\r\n更新内容は CSLT設定画面->「CSLTについて」->「リリースノート」にて確認できます。");
                    } else {
                        alert("Clean-Spam-Link-Tweetの初期設定構築が完了しました！\r\nTwitterの再読み込みを行ってください。");
                    }
                });
                console.groupEnd();
            } else {
                console.log("CSLT Settings Found!");
                cslp_settings = JSON.parse(cslp_settings.cslp_settings);
                //クライアントのルートを取得する
                let target_elem = document.getElementById("react-root");
                if(!target_elem){
                    //新クライアントの場合
                    target_elem = document.querySelector('main');
                    is_new_client = true;
                }
                console.log(target_elem)
                //Write Latest Version
                cslp_settings.filter_update = json[0].developer_update;
                cslp_settings.filter_link = json[0].thanks_link;
                cslp_settings.filter_thanks = json[0].thanks_name;
                chrome.storage.local.set({ 'cslp_settings': JSON.stringify(cslp_settings) }, function () {
                    console.log("Filter Version Write OK");
                });
                //正規表現作成
                if (cslp_settings.disable_hit == true) {
                    reg_exp += `|${json[1].disable_concat_regex}`;
                }
                if (cslp_settings.amazon_hit == true) {
                    amazon_link_regexp = new RegExp(json[1].amazon_link_filter);
                }
                if (cslp_settings.short_url_hit_disable == true) {
                    reg_exp = reg_exp.replaceAll(disable_short_url_regexp, "cslt_disable_url");
                }
                if (cslp_settings.look_profile_spam_block == true) {
                    look_profile_spam_regexp = new RegExp(json[1].look_profile_site_spam_regex, 'g');
                }
                if (cslp_settings.reprint_manga_spam_block == true) {
                    reprint_manga_spam_regexp = new RegExp(json[1].spam_manga_text_regex);
                }
                if (cslp_settings.affiliate_spam_block == true) {
                    affiliate_url_regexp = new RegExp(json[1].affiliate_spam_url);
                    affiliate_text_regexp = new RegExp(json[1].affiliate_spam_text);
                    affiliate_user_text_regexp = new RegExp(json[1].adult_affiliate_spam_user_text);
                }
                if (cslp_settings.user_register_word_list != "") {
                    if(!cslp_settings.register_word_regexp_mode){
                        user_blocking_word_list_regexp = array_regexp_escape(cslp_settings.user_register_word_list.split(","), false);
                        //console.log(user_blocking_word_list_regexp)
                    }else{
                        user_blocking_word_list_regexp = new RegExp(`(${cslp_settings.user_register_word_list.split(",").join("|")})`);
                        //console.log(user_blocking_word_list_regexp)
                    }
                }
                if(cslp_settings.scam_induction_spam_block){
                    scam_induction_spam_block_regexp = new RegExp(json[1].scam_induction_spam_text);
                    scam_induction_spam_user_block_regexp = new RegExp(json[2].scam_users);
                }
                if(json[1].scam_induction_spam_user_text){
                    scam_induction_spam_user_text_regexp = new RegExp(json[1].scam_induction_spam_user_text);
                }
                if (cslp_settings.user_register_hideuser.length != 0) {
                    hide_user_list_regexp = array_regexp_escape(cslp_settings.user_register_hideuser, false);
                }
                if (cslp_settings.user_register_whitelist.length != 0) {
                    user_whitelist_regexp = array_regexp_escape(cslp_settings.user_register_whitelist, false);
                }
                //投稿自動化ツールクライアント正規表現作成
                if(cslp_settings.auto_tweet_tools_tweet_block){
                    auto_tweet_tools_client_name_regexp = new RegExp(json[1].auto_tweet_client_name);
                }
                //文字で非表示正規表現作成
                if (cslp_settings.arabic_reply_block == true) {
                    const hide_text_mode_keys = Object.keys(cslp_settings.arabic_reply_block_lang);
                    let hide_text_unicode = "";
                    let arabic_regexp_str = null;
                    for (let index = 0; index < hide_text_mode_keys.length; index++) {
                        if (cslp_settings.arabic_reply_block_lang[hide_text_mode_keys[index]] == true) {
                            if (hide_text_mode_keys[index] != "english") {
                                hide_text_unicode += hide_text_regexp[hide_text_mode_keys[index]];
                            }
                        }
                    }
                    //英語正規表現追加
                    if (cslp_settings.arabic_reply_block_lang.english) {
                        arabic_regexp_str = `[${hide_text_unicode}]|${hide_text_regexp.english}`;
                    } else {
                        arabic_regexp_str = `[${hide_text_unicode}]`;
                    }
                    arabic_regexp = new RegExp(arabic_regexp_str, 'g');
                }
                block_regexp = new RegExp(reg_exp);
                advanced_regexp = json[1].hit_url_adv_filter;
                //除外設定CSSセレクタ作成
                const exclusion_css_selector = [];
                exclusion_css_selector.push('[cslt_tweet_info_mytweet_flag="true"]');
                if (cslp_settings.following_user_exclusion) {
                    exclusion_css_selector.push('[cslt_tweet_info_following_flag="true"]');
                }
                cslt_exclusion_css_flag = exclusion_css_selector.join(",");
                //報告ボタンサイズ変更適用
                if (cslp_settings.oneclick_report || cslp_settings.oneclick_report_after_mode == 3 || cslp_settings.oneclick_report_after_mode == 4 || cslp_settings.oneclick_report_after_mode == 5) {
                    let cslt_report_icon_size = "20";
                    switch (cslp_settings.oneclick_report_btn_size) {
                        case "0":
                            cslt_report_icon_size = "20";
                            break;
                        case "1":
                            cslt_report_icon_size = "30";
                            break;
                        case "2":
                            cslt_report_icon_size = "40";
                            break;
                        case "3":
                            cslt_report_icon_size = "50";
                            break;
                        default:
                            cslt_report_icon_size = "20";
                            break;
                    }
                    document.head.insertAdjacentHTML("beforeend", `
                    <style cslt_report_icon_css>
                        .cslt_report_icon{
                            width: ${cslt_report_icon_size}px;
                            height: ${cslt_report_icon_size}px;
                        }
                    </style>
                `);
                }
                //インプ稼ぎフィルタ読み込み
                if (cslp_settings.imp_user_block == true) {
                    console.log("Use impression list mode");
                    fetch(imp_filter_url, {
                        method: "GET",
                        cache: "no-store"
                    }).then(response => {
                        if (!response.ok) {
                            console.error('IMP List load error!');
                        }
                        return response.json();
                    }).catch(error => {
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
                        }).catch(error => {
                            console.log("Internal list load error");
                            alert("内蔵インプレフィルタリストの自動読み込みに失敗しました");
                        })
                        return internal_imp_list;
                        //
                    }).then(imp_json => {
                        imp_user_block_list_regexp = new RegExp(imp_json[1].concat_regex);
                        //console.log(imp_user_block_list_regexp)
                        cslp_settings.imp_filter_update = imp_json[0].developer_update;
                        chrome.storage.local.set({ 'cslp_settings': JSON.stringify(cslp_settings) }, function () {
                            console.log("IMP Filter Version Write OK");
                        });
                    });
                }
                //コピー用divキーダウン有効
                if (cslp_settings.hit_url_copy == true) {
                    document.addEventListener("keydown", function (key) {
                        if (key.code == "ControlLeft") {
                            if (shift_key_status == 0) {
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "visible";
                                }
                            }
                            shift_key_status = 1;
                        }
                        if (key.altKey && key.code == "KeyL") {
                            if (l_key_status == 0) {
                                for (let index = 0; index < document.getElementsByClassName("cslt_tweetdata_copy").length; index++) {
                                    document.getElementsByClassName("cslt_tweetdata_copy")[index].style.visibility = "visible";
                                }
                            }
                            l_key_status = 1;
                        }
                    });
                    document.addEventListener("keyup", function (key) {
                        if (key.code == "ControlLeft") {
                            if (shift_key_status == 1) {
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                                }
                            }
                            shift_key_status = 0;
                        }
                        if (key.altKey && key.code == "KeyL") {
                            if (l_key_status == 1) {
                                for (let index = 0; index < document.getElementsByClassName("cslt_tweetdata_copy").length; index++) {
                                    document.getElementsByClassName("cslt_tweetdata_copy")[index].style.visibility = "hidden";
                                }
                            }
                            l_key_status = 0;
                        }
                    });
                }
                /* ページ検出関連関数 */
                //タイムライン検出用
                function is_timeline_follow() {
                    const tl_tab_elem = document.querySelectorAll('div[data-testid="ScrollSnap-List"] div[role="tab"]');
                    if (tl_tab_elem[1]?.getAttribute('aria-selected') != undefined) {
                        if (window.location.pathname.match("\/home")?.length == 1 && tl_tab_elem[1]?.getAttribute('aria-selected') == "true") {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                }
                //フォロー欄検出用
                function is_follow_page() {
                    if (window.location.pathname.match(/\/followers|\/followers|\/following|\/verified_followers/g)?.length == 1) {
                        return true;
                    } else {
                        return false;
                    }
                }
                //
                function is_status_rt() {
                    if (window.location.pathname.split("/")[4]?.match(/retweets/g)?.length == 1) {
                        return true;
                    } else {
                        return false;
                    }
                }
                //ユーザーページ検出用
                function is_user_page() {
                    if (document.querySelector('div[data-testid="UserName"]') != null) {
                        return true;
                    } else {
                        return false
                    }
                }
                //ブックマーク検出用
                function is_bookmark_page() {
                    if (location.pathname.split("/")[2] == 'bookmarks') {
                        return true;
                    } else {
                        return false;
                    }
                }
                //報告用タイムライン検出関数
                function is_timeline_follow_report() {
                    if (cslp_settings.oneclick_report_timeline_disable == true && window.location.pathname.match("\/home")?.length == 1 && document.querySelectorAll('div[data-testid="ScrollSnap-List"] div[role="tab"]')[1]?.getAttribute('aria-selected') == "true") {
                        return true;
                    } else {
                        return false;
                    }
                }
                //要素検証用関数
                function target_element_num(input_element_num, input_selector){
                    const target_verifi_element = target_elem.querySelectorAll(input_selector);
                    if(input_element_num == target_verifi_element.length){
                        return true;
                    }else{
                        return false;
                    }
                }
                /* メイン動作関数 */
                function run() {
                    //const cslt_performance_logging_start = performance.now();
                    //ブロック・ミュートリストページ機能追加
                    if (window.location.pathname.match("\/settings\/blocked|\/settings\/muted/")?.length == 1) {
                        block_mute_io();
                    }
                    /* 報告ボタン通知欄非表示時動作無効化 */
                    if(cslp_settings.oneclick_report_notification_page_disable && window.location.pathname.match(/^\/notifications$/)?.length == 1 || cslp_settings.oneclick_report_after_mode == "5" && window.location.pathname.match(/^\/notifications$/)?.length == 1){
                        return;
                    }
                    /*以下、スパム対策と報告用機能付加処理*/
                    //元ツイートスクリーンネーム取得
                    const tweet_root_user_scrname = get_tweet_status_root_user();
                    const target_tweet_ids = [];
                    //ターゲット要素取得(任意のフラグは「:not()」内にOR条件で追加しましょう)
                    const not_selector = `:not([cslt_tweet_info_mytweet_flag="true"],[cslt_white_list_user],[cslt_hide_flag="true"],[cslt_blue_bypass_flag="true"],[cslt_night_spam_processed_flag="true"],[cslt_process_ok="true"],[cslt_temp_fail_report_flag="fail_tweet"])`;
                    const target_selector = `div[data-testid="cellInnerDiv"][cslt_tweet_info]${not_selector},li[cslt_tweet_info]${not_selector}`;//,[cslt_report_btn_set_flag="true"] ${cslt_exclusion_css_flag}
                    const target_tweet_element = target_elem.querySelectorAll(target_selector);
                    console.log(target_tweet_element)
                    /* 非表示等動作 */
                    /* TIPS:新しい非表示機能付けたけど画面が固まってしまう場合、フラグが立っていない可能性があります！
                    非表示処理後は「cslt_hide_flag」の値を「true」にしたフラグを立てましょう。
                    非表示以外の機能追加の場合は分かりやすい任意のフラグを追加してください！*/
                    for (let target_index = 0; target_index < target_tweet_element.length; target_index++) {
                        //要素取りこぼし検証
                        if (!target_element_num(target_tweet_element.length, target_selector)) {
                            break;
                        }
                        const cslt_target_tweet_elem = target_tweet_element[target_index];
                        const cslt_tweet_info_obj = JSON.parse(cslt_target_tweet_elem.getAttribute('cslt_tweet_info'));
                        //フォロー中ユーザー除外設定フラグ
                        let processing_following_user_exclusion_flag = true;
                        if(cslp_settings.following_user_exclusion){
                            if(cslt_target_tweet_elem.getAttribute("cslt_tweet_info_following_flag") == "true"){
                                processing_following_user_exclusion_flag = false;
                            }
                        }
                        /* 通知欄処理開始 */
                        if(cslt_target_tweet_elem.getAttribute("cslt_notifications_page_element") != undefined){
                            const notication_users_info = cslt_tweet_info_obj;
                            //console.log(notication_users_info.user_data_array);
                            report_btn_init(cslt_target_tweet_elem, "notification", notication_users_info);
                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                            continue;
                        }
                        /* 非表示処理開始 */
                        if (!cslt_tweet_info_obj.is_root_tweet) {
                            /* 元ツイート以外に適用するにはこの中に記述 */
                            //ブロックされているアカウント非表示
                            if(cslp_settings.blocked_by_hide){
                                if(cslt_tweet_info_obj.user_data.blocked_by){
                                    //console.log("UserBlocked=>"+cslt_tweet_info_obj.text)
                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                    cslt_target_tweet_elem.textContent = "";
                                    continue;
                                }
                                //引用チェック
                                if(cslt_tweet_info_obj.quoted_obj != null && cslt_tweet_info_obj.quoted_obj.user_data.blocked_by){
                                    //console.log("UserBlockedQuoted=>"+cslt_tweet_info_obj.text)
                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                    cslt_target_tweet_elem.textContent = "";
                                    continue;
                                }
                            }
                            /* リツイート欄等では非表示機能を無効化 */
                            if (!is_status_rt() && processing_following_user_exclusion_flag) {
                                //ホワイトリスト処理
                                if (cslp_settings.user_register_whitelist.length != 0) {
                                    if (user_whitelist_regexp.test(cslt_tweet_info_obj.user_data.scr_name)) {
                                        //console.log("match=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_white_list_user", "");
                                        if(cslp_settings.oneclick_report_btn_all_users || processing_following_user_exclusion_flag){
                                            report_btn_init(cslt_target_tweet_elem, "nomal", null);
                                        }
                                        continue;
                                    }
                                }
                                //ブラックリスト処理
                                if (cslp_settings.user_register_hideuser.length != 0) {
                                    if (hide_user_list_regexp.test(cslt_tweet_info_obj.user_data.scr_name)) {
                                        //console.log("black_match=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //ユーザー非表示ワードリスト
                                if (cslp_settings.user_register_word_list != "") {
                                    //ユーザープロフィール文チェック
                                    if (cslp_settings.user_register_word_hide_profile) {
                                        if (user_blocking_word_list_regexp.test(cslt_tweet_info_obj.user_data.description)) {
                                            //console.log("UserWordListProfile=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                    //返信or単一ツイートのみの場合
                                    if (user_blocking_word_list_regexp.test(cslt_tweet_info_obj.text)) {
                                        //console.log("UserWordListReply=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                    //引用内の場合
                                    if (cslt_tweet_info_obj.quoted_obj != null) {
                                        if (user_blocking_word_list_regexp.test(cslt_tweet_info_obj.quoted_obj.text)) {
                                            //console.log("UserWordListQuoted=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                }
                                //プロモーション非表示
                                if(cslp_settings.promotion_hide){
                                    if(cslt_tweet_info_obj.is_promoted){
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //AI生成フラグ投稿非表示
                                if(cslp_settings.block_ai_generated_flag){
                                    if(cslt_tweet_info_obj.content_disclosure?.ai_generated_disclosure?.has_ai_generated_media){
                                        //console.log("AIGeneratedFlag=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //AI生成フラグ投稿非表示(引用)
                                if(cslp_settings.block_ai_generated_flag_on_quoted_post){
                                    if(cslt_tweet_info_obj.quoted_obj?.content_disclosure?.ai_generated_disclosure?.has_ai_generated_media){
                                        //console.log("AIGeneratedFlagQuoted=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //プロモーションフラグ投稿非表示
                                if(cslp_settings.block_advertising_flag){
                                    if(cslt_tweet_info_obj.content_disclosure?.advertising_disclosure?.is_paid_promotion){
                                        //console.log("AdvertisingFlag=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //プロモーションフラグ投稿非表示(引用)
                                if(cslp_settings.block_advertising_flag_on_quoted_post){
                                    if(cslt_tweet_info_obj.quoted_obj?.content_disclosure?.advertising_disclosure?.is_paid_promotion){
                                        //console.log("AdvertisingFlagQuoted=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //Twitter_for_Advertisers投稿非表示
                                if (cslp_settings.tw_for_adv_block == true) {
                                    if (cslt_tweet_info_obj.tweet_client == 'Twitter for Advertisers') {
                                        //console.log("TwitterForAdvertisers=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        //cslt_target_tweet_elem.setAttribute("cslt_tw_for_adv_flag", "tw4adv_spam_ok");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //Grok共有付き投稿非表示
                                if(cslp_settings.grok_share_block){
                                    let grok_share_tweet_flag = false;
                                    if(cslt_tweet_info_obj.grok_share_attachment){
                                        grok_share_tweet_flag = true;
                                    }
                                    if(cslt_tweet_info_obj.attached_urls){
                                        for (let attached_urls_index = 0; attached_urls_index < cslt_tweet_info_obj.attached_urls.length; attached_urls_index++) {
                                            if (cslt_tweet_info_obj.attached_urls[attached_urls_index].expanded_url.match(/\/i\/grok\/share|grok.com\/share/)) {
                                                grok_share_tweet_flag = true;
                                                break;
                                            }
                                        }
                                    }
                                    if(grok_share_tweet_flag){
                                        //console.log("GrokShareTweet=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                    //引用
                                    if(cslt_tweet_info_obj.quoted_obj?.quoted_urls){
                                        let grok_share_quoted_flag = false;
                                        const quoted_urls = cslt_tweet_info_obj.quoted_obj.quoted_urls;
                                        for (let quoted_index = 0; quoted_index < quoted_urls.length; quoted_index++) {
                                            if(quoted_urls[quoted_index].expanded_url.match(/\/i\/grok\/share|grok.com\/share/)){
                                                grok_share_quoted_flag = true;
                                                break;
                                            }
                                        }
                                        if(grok_share_quoted_flag){
                                            //console.log("GrokShareQuoted=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                }
                                //Grok呼び出し&回答リプ非表示
                                if(cslp_settings.grok_called_response_block){
                                    if(cslt_tweet_info_obj.mentions){
                                        let grok_mentions_flag = false;
                                        //Grok回答生成リプ
                                        if(cslt_tweet_info_obj.user_data.scr_name === "grok"){
                                            //console.log("GrokResponseReply=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                        //Grok呼び出し
                                        for (let grok_mentions_index = 0; grok_mentions_index < cslt_tweet_info_obj.mentions.length; grok_mentions_index++) {
                                            if(cslt_tweet_info_obj.mentions[grok_mentions_index].screen_name === "grok"){
                                                grok_mentions_flag = true;
                                                break;
                                            }
                                        }
                                        if(grok_mentions_flag){
                                            //console.log("GrokCalledReply=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                        //引用
                                        if(cslt_tweet_info_obj.quoted_obj){
                                            //呼び出し引用
                                            let grok_mentions_quoted_flag = false;
                                            if(cslt_tweet_info_obj.quoted_obj.mentions){
                                                for (let grok_mentions_index = 0; grok_mentions_index < cslt_tweet_info_obj.quoted_obj.mentions.length; grok_mentions_index++) {
                                                    if(cslt_tweet_info_obj.quoted_obj.mentions[grok_mentions_index].screen_name === "grok"){
                                                        grok_mentions_quoted_flag = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if(grok_mentions_quoted_flag){
                                                //console.log("GrokCalledQuoted=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                            //回答生成引用
                                            if(cslt_tweet_info_obj.quoted_obj.user_data.scr_name === "grok"){
                                                //console.log("GrokResponseQuoted=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                        }
                                    }
                                }
                                //投稿自動化ツールクライアント投稿非表示
                                if(cslp_settings.auto_tweet_tools_tweet_block){
                                    if(auto_tweet_tools_client_name_regexp.test(cslt_tweet_info_obj.tweet_client)){
                                        //console.log("AutoTweetTools=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //詐欺・誘導系スパム非表示
                                if(cslp_settings.scam_induction_spam_block){
                                    //スクリーンネームチェック
                                    if(scam_induction_spam_user_block_regexp.test(cslt_tweet_info_obj.user_data.scr_name)){
                                        //console.log("ScamUsersList=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                    //メンションスクリーンネームチェック
                                    if(cslt_tweet_info_obj.mentions){
                                        let scam_users_screen_name_check_flag = false;
                                        for (let scam_users_mentions_index = 0; scam_users_mentions_index < cslt_tweet_info_obj.mentions.length; scam_users_mentions_index++) {
                                            if(scam_induction_spam_user_block_regexp.test(cslt_tweet_info_obj.mentions[scam_users_mentions_index].screen_name)){
                                                scam_users_screen_name_check_flag = true;
                                                break;
                                            }
                                        }
                                        if(scam_users_screen_name_check_flag){
                                            //console.log("ScamUsersListMentions=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                    
                                    //ツイートチェック
                                    if(scam_induction_spam_block_regexp.test(cslt_tweet_info_obj.text)){
                                        //console.log("ScamInductionText=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                    //ユーザープロフィール文チェック
                                    if(scam_induction_spam_user_text_regexp){
                                        if(scam_induction_spam_user_text_regexp.test(cslt_tweet_info_obj.user_data.description)){
                                            //console.log("ScamInductionDescription=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                }
                                //プロフィール文空白アカウント非表示
                                if(cslp_settings.blank_profile_hide){
                                    if(cslt_tweet_info_obj.user_data.description == ""){
                                        //console.log("ProfileDescriptionBlank=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //最近作成されたアカウント非表示
                                if(cslp_settings.recent_created_account_hide){
                                    if(is_date_with_month(cslt_tweet_info_obj.user_data.account_create_date, Number(cslp_settings.recent_created_account_hide_range))){
                                        //console.log("RecentCreateUser=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //インプレ稼ぎアカウント非表示
                                if (cslp_settings.imp_user_block == true && window.location.pathname.match("\/status\/")?.length == 1 || cslp_settings.imp_filter_block_all_area == true && cslp_settings.imp_user_block == true) {
                                    if (imp_user_block_list_regexp.test(cslt_tweet_info_obj.user_data.scr_name)) {
                                        //console.log("IMPAccount=>" + cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //Amazonリンク非表示
                                if (cslp_settings.amazon_hit) {
                                    //引用の場合
                                    if (cslt_tweet_info_obj.quoted_obj != null && cslt_tweet_info_obj.quoted_obj.quoted_urls != null && cslt_tweet_info_obj.quoted_obj.quoted_urls.length != 0) {
                                        let amazon_link_quoted_hide_flag = false;
                                        for (let quoted_index = 0; quoted_index < cslt_tweet_info_obj.quoted_obj.quoted_urls.length; quoted_index++) {
                                            if (amazon_link_regexp.test(new URL(cslt_tweet_info_obj.quoted_obj.quoted_urls[quoted_index].expanded_url).host)) {
                                                //console.log("AmazonLinkQuoted=>"+cslt_tweet_info_obj.text)
                                                amazon_link_quoted_hide_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                break;
                                            }
                                        }
                                        if (amazon_link_quoted_hide_flag) {
                                            continue;
                                        }
                                    }
                                    //ツイート本文の場合
                                    if (cslt_tweet_info_obj.attached_urls != null && cslt_tweet_info_obj.attached_urls.length != 0) {
                                        let amazon_link_reply_hide_flag = false;
                                        for (let attached_urls_index = 0; attached_urls_index < cslt_tweet_info_obj.attached_urls.length; attached_urls_index++) {
                                            if (amazon_link_regexp.test(new URL(cslt_tweet_info_obj.attached_urls[attached_urls_index].expanded_url).host)) {
                                                //console.log("AmazonLink=>"+cslt_tweet_info_obj.text)
                                                amazon_link_reply_hide_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                break;
                                            }
                                        }
                                        if (amazon_link_reply_hide_flag) {
                                            continue;
                                        }
                                    }
                                }
                                //Blueブロック
                                if (cslp_settings.blue_block == true && window.location.pathname.split("/")[2] == 'status') {
                                    //元ツイートBlueユーザー除外フラグ付加
                                    if (cslp_settings.root_tweetuser_block == true && window.location.pathname.split("/")[4] != 'quotes') {
                                        if (tweet_root_user_scrname == cslt_tweet_info_obj.user_data.scr_name) {
                                            cslt_target_tweet_elem.setAttribute("cslt_blue_bypass_flag", "true");
                                            if(cslp_settings.oneclick_report_btn_all_users || processing_following_user_exclusion_flag){
                                                report_btn_init(cslt_target_tweet_elem, "nomal", null);
                                            }
                                            continue;
                                        }
                                    }
                                    //Blue非表示処理開始
                                    let blue_hide_process_flag = false;
                                    switch (cslp_settings.blue_block_mode) {
                                        case "0":
                                            //Blueマーク付を文字数で非表示
                                            if (cslt_tweet_info_obj.user_data.is_blue) {
                                                let hide_blue_tweet_text = cslt_tweet_info_obj.text;
                                                if (cslt_tweet_info_obj.is_reply) {
                                                    //メンションを削除
                                                    hide_blue_tweet_text = cslt_tweet_info_obj.text.replace(/@\w+\s*/g, "");
                                                }
                                                if (hide_blue_tweet_text.length <= Number(cslp_settings.blue_block_value_num)) {
                                                    blue_hide_process_flag = true;
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                }
                                            }
                                            break;
                                        case "1":
                                            //全ユーザーを文字数で非表示
                                            let hide_blue_tweet_text = cslt_tweet_info_obj.text;
                                            if (cslt_tweet_info_obj.is_reply) {
                                                //メンションを削除
                                                hide_blue_tweet_text = cslt_tweet_info_obj.text.replace(/@\w+\s*/g, "");
                                            }
                                            if (hide_blue_tweet_text.length <= Number(cslp_settings.blue_block_value_num)) {
                                                blue_hide_process_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                            }
                                            break;
                                        case "2":
                                            //Blueマーク付を全て非表示
                                            if (cslt_tweet_info_obj.user_data.is_blue) {
                                                blue_hide_process_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                    if (blue_hide_process_flag) {
                                        continue;
                                    }
                                }
                                //無断転載漫画系スパム対策
                                if (cslp_settings.reprint_manga_spam_block == true) {// && window.location.pathname.match("\/status\/")?.length == 1 && window.location.pathname.split("/")[4] == undefined
                                    if(cslp_settings.reprint_manga_spam_area_option == "0" && window.location.pathname.match("\/status\/")?.length == 1 && window.location.pathname.split("/")[4] == undefined || cslp_settings.reprint_manga_spam_area_option == "1" && window.location.pathname.match(/\/status\/|\/search/)?.length == 1 && window.location.pathname.split("/")[4] == undefined || cslp_settings.reprint_manga_spam_area_option == "2" && window.location.pathname.split("/")[4] == undefined){
                                        if (cslt_tweet_info_obj.quoted_obj != null) {
                                            const quoted_text_replace_space = cslt_tweet_info_obj.quoted_obj.text.replace(/\s+/g, "");
                                            if (cslp_settings.reprint_manga_spam_block_strict == true) {
                                                //厳格モード有効時
                                                if (cslp_settings.reprint_manga_spam_block_root_user_disable == true) {
                                                    //投稿主除外
                                                    if (tweet_root_user_scrname != cslt_tweet_info_obj.user_data.scr_name) {
                                                        if (reprint_manga_spam_regexp.test(quoted_text_replace_space)) {
                                                            //console.log("MangaNotRoot=>"+cslt_tweet_info_obj.text)
                                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                            cslt_target_tweet_elem.textContent = "";
                                                            if (cslt_target_tweet_elem.textContent != "") {
                                                                //console.log("取りこぼし")
                                                            }
                                                            continue;
                                                        }
                                                    }
                                                } else {
                                                    //投稿主除外オフ
                                                    if (reprint_manga_spam_regexp.test(quoted_text_replace_space)) {
                                                        //console.log("Manga=>"+cslt_tweet_info_obj.text)
                                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                        cslt_target_tweet_elem.textContent = "";
                                                        continue;
                                                    }
                                                }
                                            } else {
                                                if (cslp_settings.reprint_manga_spam_block_root_user_disable == true) {
                                                    //投稿主除外
                                                    if (tweet_root_user_scrname != cslt_tweet_info_obj.user_data.scr_name) {
                                                        if (cslt_tweet_info_obj.quoted_obj.possibly_sensitive == true || cslt_tweet_info_obj.quoted_obj.possibly_sensitive_editable == true && reprint_manga_spam_regexp.test(quoted_text_replace_space)) {
                                                            //console.log("MangaNotRoot=>"+cslt_tweet_info_obj.text)
                                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                            cslt_target_tweet_elem.textContent = "";
                                                            continue;
                                                        }
                                                    }
                                                } else {
                                                    //投稿主除外オフ
                                                    if (cslt_tweet_info_obj.quoted_obj.possibly_sensitive == true || cslt_tweet_info_obj.quoted_obj.possibly_sensitive_editable == true && reprint_manga_spam_regexp.test(quoted_text_replace_space)) {
                                                        //console.log("Manga=>"+cslt_tweet_info_obj.text)
                                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                        cslt_target_tweet_elem.textContent = "";
                                                        continue;
                                                    }
                                                }
                                            }
                                        }else{
                                            //厳格化で本ツイートもチェック
                                            //厳格モード有効時
                                            if (cslp_settings.reprint_manga_spam_block_strict == true && cslt_tweet_info_obj?.text) {
                                                const tweet_text_replace_space = cslt_tweet_info_obj.text.replace(/\s+/g, "");
                                                if (cslp_settings.reprint_manga_spam_block_root_user_disable == true) {
                                                    //投稿主除外
                                                    if (tweet_root_user_scrname != cslt_tweet_info_obj.user_data.scr_name) {
                                                        if(reprint_manga_spam_regexp.test(tweet_text_replace_space)){
                                                            //console.log("MangaNotRootText=>"+cslt_tweet_info_obj.text)
                                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                            cslt_target_tweet_elem.textContent = "";
                                                            continue;
                                                        }
                                                    }
                                                }else{
                                                    if(reprint_manga_spam_regexp.test(tweet_text_replace_space)){
                                                        //console.log("MangaNotRootText=>"+cslt_tweet_info_obj.text)
                                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                        cslt_target_tweet_elem.textContent = "";
                                                        continue;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //アフィリエイトスパム対策
                                if (cslp_settings.affiliate_spam_block == true) {// && window.location.pathname.match("\/status\/")?.length == 1 && window.location.pathname.split("/")[4] == undefined
                                    if(cslp_settings.affiliate_spam_area_option == "0" && window.location.pathname.match("\/status\/")?.length == 1 && window.location.pathname.split("/")[4] == undefined || cslp_settings.affiliate_spam_area_option == "1" && window.location.pathname.match(/\/status\/|\/search/)?.length == 1 && window.location.pathname.split("/")[4] == undefined || cslp_settings.affiliate_spam_area_option == "2" && window.location.pathname.split("/")[4] == undefined){
                                        //厳格化
                                        if (cslp_settings.affiliate_spam_block_strict) {
                                            //プロフィール文が空白の場合(アカウント売買タイプが目立ってきたため、無効中)
                                            /*if(cslt_tweet_info_obj.user_data.description == ""){
                                                //console.log("AffiliateProfileDescriptionBlank=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }*/
                                            //1か月以内に作成されたアカウントの場合(アカウント売買タイプが目立ってきたため、無効中)
                                            /*if(is_date_with_month(cslt_tweet_info_obj.user_data.account_create_date, 1)){
                                                //console.log("AffiliateRecentCreateUser=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }*/
                                            //ツイートのlangがzhの場合
                                            if (cslt_tweet_info_obj.tweet_lang == "zh") {
                                                //console.log("AffiliateStrictLangZh=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                            //返信本文チェック
                                            if(cslt_tweet_info_obj?.text){
                                                const affiliate_check_text = cslt_tweet_info_obj.text.replace(/@\w+\s*/g, "");
                                                if (affiliate_text_regexp.test(affiliate_check_text) || affiliate_user_text_regexp.test(affiliate_check_text)) {
                                                    //console.log("AffiliateStrictText=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                                //返信本文URLバイパスチェック
                                                if(affiliate_url_regexp.test(affiliate_check_text)){
                                                    //console.log("AffiliateStrictTextURLBypass=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                            }
                                            //返信本文ユーザープロフィール文チェック
                                            if (affiliate_text_regexp.test(cslt_tweet_info_obj.user_data.description) || affiliate_user_text_regexp.test(cslt_tweet_info_obj.user_data.description)) {
                                                //console.log("AffiliateStrictUserDescriptionText=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                            //引用
                                            if (cslt_tweet_info_obj.quoted_obj != null) {
                                                let affiliate_check_quoted_text = cslt_tweet_info_obj.quoted_obj.text.replace(/@\w+\s*/g, "");
                                                //引用のプロフィール文が空白の場合
                                                if(cslt_tweet_info_obj.quoted_obj.user_data.description == ""){
                                                    //console.log("AffiliateStrictQuotedProfileDescriptionBlank=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                                //引用の1か月以内に作成されたアカウントの場合
                                                if(is_date_with_month(cslt_tweet_info_obj.quoted_obj.user_data.account_create_date, 1)){
                                                    //console.log("AffiliateStrictQuotedRecentCreateUser=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                                //引用のlangがzhの場合
                                                if (cslt_tweet_info_obj.quoted_obj.tweet_lang == "zh") {
                                                    //console.log("AffiliateStrictQuotedLangZh=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                                //引用返信文
                                                if (affiliate_text_regexp.test(affiliate_check_quoted_text) || affiliate_user_text_regexp.test(affiliate_check_quoted_text)) {
                                                    //console.log("AffiliateStrictQuotedText=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                                //引用返信ユーザー
                                                if (affiliate_text_regexp.test(cslt_tweet_info_obj.quoted_obj.user_data.description) || affiliate_user_text_regexp.test(cslt_tweet_info_obj.quoted_obj.user_data.description)) {
                                                    //console.log("AffiliateStrictUserDescriptionText=>"+cslt_tweet_info_obj.text)
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    continue;
                                                }
                                            }
                                            //動画引用元ユーザーチェック
                                            if (cslt_tweet_info_obj.tweet_video_info != null) {
                                                let quoted_video_user_hide_flag = false;
                                                for (let video_index = 0; video_index < cslt_tweet_info_obj.tweet_video_info.length; video_index++) {
                                                    if(cslt_tweet_info_obj.tweet_video_info[video_index]?.video_source_user_info != undefined){
                                                        if (affiliate_user_text_regexp.test(cslt_tweet_info_obj.tweet_video_info[video_index].video_source_user_info.user_data.description)||affiliate_text_regexp.test(cslt_tweet_info_obj.tweet_video_info[video_index].video_source_user_info.user_data.description)||cslt_tweet_info_obj.tweet_video_info[video_index].video_source_user_info.user_data.description == "") {
                                                            //console.log("AffiliateStrictVideoQuotedUserDescriptionText=>"+cslt_tweet_info_obj.text)
                                                            quoted_video_user_hide_flag = true;
                                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                            cslt_target_tweet_elem.textContent = "";
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (quoted_video_user_hide_flag) {
                                                    continue;
                                                }
                                            }
                                        }
                                        //引用のURLチェック
                                        if (cslt_tweet_info_obj.quoted_obj != null && cslt_tweet_info_obj.quoted_obj.quoted_urls != null && cslt_tweet_info_obj.quoted_obj.quoted_urls.length != 0) {
                                            let affiliate_quoted_hide_flag = false;
                                            for (let quoted_index = 0; quoted_index < cslt_tweet_info_obj.quoted_obj.quoted_urls.length; quoted_index++) {
                                                if (affiliate_url_regexp.test(cslt_tweet_info_obj.quoted_obj.quoted_urls[quoted_index].expanded_url)) {
                                                    //console.log("Affiliate=>"+cslt_tweet_info_obj.text)
                                                    affiliate_quoted_hide_flag = true;
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    break;
                                                }
                                            }
                                            if (affiliate_quoted_hide_flag) {
                                                continue;
                                            }
                                        }
                                        //引用ユーザーロケーションチェック
                                        if (cslt_tweet_info_obj.quoted_obj != null) {
                                            if(affiliate_text_regexp.test(cslt_tweet_info_obj.quoted_obj.user_data.location)){
                                                //console.log("QuotedAffiliateStrictUserLocation=>"+cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                        }
                                        //ツイート本文ユーザーロケーションチェック
                                        if(affiliate_text_regexp.test(cslt_tweet_info_obj.user_data.location)){
                                            //console.log("AffiliateStrictUserLocation=>"+cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                        //ツイート本文URLチェック
                                        if (cslt_tweet_info_obj.attached_urls != null && cslt_tweet_info_obj.attached_urls.length != 0) {
                                            let affiliate_reply_hide_flag = false;
                                            for (let attached_urls_index = 0; attached_urls_index < cslt_tweet_info_obj.attached_urls.length; attached_urls_index++) {
                                                if (affiliate_url_regexp.test(cslt_tweet_info_obj.attached_urls[attached_urls_index].expanded_url)) {
                                                    //console.log("Affiliate=>"+cslt_tweet_info_obj.text)
                                                    affiliate_reply_hide_flag = true;
                                                    cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                    cslt_target_tweet_elem.textContent = "";
                                                    break;
                                                }
                                            }
                                            if (affiliate_reply_hide_flag) {
                                                continue;
                                            }
                                        }
                                    }
                                }
                                //アニメーションGIF・短い秒数の動画非表示
                                if(cslp_settings.animated_gif_block || cslp_settings.short_video_block){
                                    if (cslt_tweet_info_obj.tweet_video_info != null) {
                                        let short_video_gif_hide_flag = false;
                                        for (let video_index = 0; video_index < cslt_tweet_info_obj.tweet_video_info.length; video_index++) {
                                            //アニメーションGIF
                                            if(cslp_settings.animated_gif_block && cslt_tweet_info_obj.tweet_video_info[video_index].type == 'animated_gif'){
                                                //console.log("AnimatedGIF=>"+cslt_tweet_info_obj.text)
                                                short_video_gif_hide_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                break;
                                            }
                                            //短い秒数の動画
                                            if(cslp_settings.short_video_block && cslp_settings.short_video_block_disable_tl == false || cslp_settings.short_video_block && cslp_settings.short_video_block_disable_tl && is_timeline_follow() == false && is_user_page() == false && is_bookmark_page() == false){
                                                if(cslt_tweet_info_obj.tweet_video_info[video_index].type == 'video'){
                                                    if (cslt_tweet_info_obj.tweet_video_info[video_index].duration_ms <= Number(cslp_settings.short_video_block_ms)) {
                                                        //console.log("ShortVideo=>"+cslt_tweet_info_obj.text)
                                                        short_video_gif_hide_flag = true;
                                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                        cslt_target_tweet_elem.textContent = "";
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        if (short_video_gif_hide_flag) {
                                            continue;
                                        }
                                    }
                                }
                                //プロフ見てね系スパム対策
                                if (cslp_settings.look_profile_spam_block == true) {
                                    if (look_profile_spam_regexp.test(cslt_tweet_info_obj.text)) {
                                        //console.log("LookProfile=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //絵文字文章(引用も対象)非表示
                                if (cslp_settings.hide_emoji_text && window.location.pathname.match("\/status\/")?.length == 1) {
                                    const hide_emoji_tweet_text = cslt_tweet_info_obj.text.replace(/@\w+\s*/g, "");
                                    let hide_emoji_tweet_quoted_text = null;
                                    if (cslt_tweet_info_obj.quoted_obj != null) {
                                        hide_emoji_tweet_quoted_text = cslt_tweet_info_obj.quoted_obj.text;
                                    }

                                    if (emoji_text_regexp.test(hide_emoji_tweet_text) || cslt_tweet_info_obj.quoted_obj != null && emoji_text_regexp.test(hide_emoji_tweet_quoted_text)) {
                                        //console.log("EmojiText=>"+cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //アラビア文字等の海外語圏の文字が含まれた返信
                                if (cslp_settings.arabic_reply_block == true && window.location.pathname.match("\/status\/")?.length == 1) {
                                    const replace_emoji_regexp = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu;
                                    //絵文字を排除
                                    const delete_emoji_user_name = cslt_tweet_info_obj.user_data.name.replace(replace_emoji_regexp, "");
                                    const delete_emoji_user_profile = cslt_tweet_info_obj.user_data.description.replace(replace_emoji_regexp, "");
                                    const delete_emoji_text = cslt_tweet_info_obj.text.replace(replace_emoji_regexp, "");
                                    //アラビア文字等ユーザー対象有効時
                                    if (cslp_settings.arabic_user_reply_block == true) {
                                        if (arabic_regexp.test(delete_emoji_user_name)) {
                                            //console.log("ArabicUser=>" + cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                    //ユーザーアカウントプロフィールテキストチェック
                                    if (cslp_settings.arabic_user_profile_text_block) {
                                        if (arabic_regexp.test(delete_emoji_user_profile)) {
                                            //console.log("ArabicUserDescription=>" + cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                    //テキストチェック
                                    if (arabic_regexp.test(delete_emoji_text)) {
                                        //console.log("ArabicUserText=>" + cslt_tweet_info_obj.text)
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                    //引用チェック
                                    if (cslt_tweet_info_obj.quoted_obj != null) {
                                        const delete_emoji_quoted_user_name = cslt_tweet_info_obj.quoted_obj.user_data.name.replace(replace_emoji_regexp, "");
                                        const delete_emoji_quoted_user_profile = cslt_tweet_info_obj.quoted_obj.user_data.description.replace(replace_emoji_regexp, "");
                                        const delete_emoji_quoted_text = cslt_tweet_info_obj.quoted_obj.text.replace(replace_emoji_regexp, "");
                                        //引用内ユーザー名チェック
                                        if (cslp_settings.arabic_user_reply_block == true) {
                                            if (arabic_regexp.test(delete_emoji_quoted_user_name)) {
                                                //console.log("ArabicUserQuotedName=>" + cslt_tweet_info_obj.text)
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                continue;
                                            }
                                        }
                                        //引用内のユーザー説明文チェック
                                        if (arabic_regexp.test(delete_emoji_quoted_user_profile)) {
                                            //console.log("ArabicUserQuotedDescription=>" + cslt_tweet_info_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                        //引用内テキストチェック
                                        if (arabic_regexp.test(delete_emoji_quoted_text)) {
                                            //console.log("ArabicUserQuotedText=>" + cslt_tweet_info_obj.quoted_obj.text)
                                            cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                            cslt_target_tweet_elem.textContent = "";
                                            continue;
                                        }
                                    }
                                }
                            }
                            //報告・ブロック機能付加
                            if(cslp_settings.oneclick_report_btn_all_users || processing_following_user_exclusion_flag){
                                report_btn_init(cslt_target_tweet_elem, "nomal", null);
                            }
                            //報告・ブロック・ミュート機能で追加されたアカウントを非表示
                            if (cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2' || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4') {
                                //ブロック・ミュート完了フラグ付加
                                if (block_mute_user_ids_regex != null) {
                                    //console.log(block_mute_user_ids_regex)
                                    if (block_mute_user_ids_regex.test(cslt_tweet_info_obj.user_data.user_id)) {
                                        cslt_target_tweet_elem.setAttribute("cslt_temp_hide_flag", "complete");
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //ツイートのみ報告完了フラグ付加
                                if (report_tweet_status_ids_regex != null) {
                                    //console.log(report_tweet_status_ids_regex)
                                    if (report_tweet_status_ids_regex.test(cslt_tweet_info_obj.tweet_id)) {
                                        cslt_target_tweet_elem.setAttribute("cslt_temp_hide_flag", "complete");
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                        continue;
                                    }
                                }
                                //報告失敗アイコン変化&フラグ付加
                                if (fail_report_tweet_status_ids_regex != null) {
                                    if (fail_report_tweet_status_ids_regex.test(cslt_tweet_info_obj.tweet_id) == true) {
                                        //console.log(fail_report_tweet_status_ids.includes(cslt_tweet_info_obj.tweet_id))
                                        if (cslt_target_tweet_elem.querySelector('a[cslt_report_btn]')?.classList != null) {
                                            cslt_target_tweet_elem.querySelector('a[cslt_report_btn]').classList.add("cslt_report_fail");
                                            cslt_target_tweet_elem.setAttribute("cslt_temp_fail_report_flag", "fail_tweet");
                                            continue;
                                        }
                                    }
                                }
                                //ブロック・ミュート失敗アイコン変化&フラグ付加
                                if (fail_block_mute_user_ids_regex != null) {
                                    if (fail_block_mute_user_ids_regex.test(cslt_tweet_info_obj.user_data.user_id) == true) {
                                        if (cslt_target_tweet_elem.querySelector('a[cslt_report_btn]')?.classList != null) {
                                            cslt_target_tweet_elem.querySelector('a[cslt_report_btn]').classList.add("cslt_report_fail");
                                            cslt_target_tweet_elem.setAttribute("cslt_temp_fail_report_flag", "fail_tweet");
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                        /*元ツイート以外にも適用するにはここから記述*/
                        //ナイト系スパム対策
                        if (cslp_settings.night_spam_block == true && !is_follow_page() && !is_status_rt() && processing_following_user_exclusion_flag && window.location.search.match(/f=user/g) == null) {
                            //テキスト内のURLチェック
                            const night_spam_text_urls = cslt_tweet_info_obj.text.replaceAll('\n', ' ').match(/((https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/gi);
                            let night_spam_processed_flag = false;
                            //console.log(night_spam_text_urls)
                            if (night_spam_text_urls != null && cslt_tweet_info_obj.attached_urls != null) {
                                for (let text_urls_index = 0; text_urls_index < cslt_tweet_info_obj.attached_urls.length; text_urls_index++) {
                                    const expanded_url = cslt_tweet_info_obj.attached_urls[text_urls_index].expanded_url;
                                    const tco_url = cslt_tweet_info_obj.attached_urls[text_urls_index].url;
                                    if (night_spam_text_urls[text_urls_index] == tco_url) {
                                        if (block_regexp.test(expanded_url)) {
                                            //console.log("NightSpamText=>"+cslt_tweet_info_obj.text)
                                            if (cslp_settings.hit_del == true && !cslt_tweet_info_obj.is_root_tweet) {
                                                //ヒットツイート非表示有効&元ツイートでない場合非表示
                                                night_spam_processed_flag = true;
                                                cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                                cslt_target_tweet_elem.textContent = "";
                                                break;
                                            } else {
                                                //ヒットツイート非表示無効
                                                const night_spam_text_url_nodelist = cslt_target_tweet_elem.querySelectorAll(`div[data-testid="tweetText"] a[href="${tco_url}"]`);
                                                let ins_html;
                                                for (let spam_link_index = 0; spam_link_index < night_spam_text_url_nodelist.length; spam_link_index++) {
                                                    if (night_spam_text_url_nodelist[spam_link_index].offsetWidth < 230) {
                                                        ins_html = `<div style="position: absolute;z-index: 99999;width: ${night_spam_text_url_nodelist[spam_link_index].offsetWidth + 1}px;height: ${night_spam_text_url_nodelist[spam_link_index].offsetHeight + 5}px;max-height:25px;display: inline-flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;font-size: 0.5rem;"><p>スパム</p></div>`;
                                                    } else {
                                                        ins_html = `<div class="cslt_spam_link_found" style="position: absolute;z-index: 99999;width: ${night_spam_text_url_nodelist[spam_link_index].offsetWidth + 1}px;height: ${night_spam_text_url_nodelist[spam_link_index].offsetHeight + 5}px;max-height:25px;display: inline-flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;"><p>スパムを検出!&nbsp;(${night_spam_text_url_nodelist[spam_link_index].textContent.match(/\/\/([^/]*)/)[1]})</p></div>`;
                                                    }
                                                    night_spam_text_url_nodelist[spam_link_index].style.whiteSpace = "nowrap";
                                                    night_spam_text_url_nodelist[spam_link_index].insertAdjacentHTML("beforebegin", ins_html);
                                                    if (cslp_settings.hit_url_copy == true) {
                                                        copy_url(cslt_target_tweet_elem);
                                                    }
                                                }
                                                night_spam_processed_flag = true;
                                            }
                                        }
                                    }
                                }
                            }
                            //TwitterCard処理
                            if (cslt_tweet_info_obj.tw_card_obj != null) {
                                if (block_regexp.test(cslt_tweet_info_obj.tw_card_obj.domain)) {
                                    if (cslp_settings.hit_del == true && !cslt_tweet_info_obj.is_root_tweet) {
                                        //ヒットツイート非表示有効&元ツイートでない場合非表示
                                        night_spam_processed_flag = true;
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                    } else {
                                        const ins_html = `<div class="cslt_spam_link_found" style="position: absolute;z-index: 99999;width: 100%;height: 101%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 5px 5px 5px 5px;"><p>スパムを検出!<br>ヒットしたURL:${cslt_tweet_info_obj.tw_card_obj.domain}<br>クリックでツイートを開く</p></div>`;
                                        //cslt_target_tweet_elem.querySelector(`div[data-testid="card.wrapper"]`).insertAdjacentHTML("beforebegin", ins_html);
                                        const night_spam_twitter_card_elem = cslt_target_tweet_elem.querySelector(`div[aria-labelledby][id]`);
                                        if (night_spam_twitter_card_elem != null) {
                                            night_spam_twitter_card_elem.insertAdjacentHTML("afterbegin", ins_html);
                                            if (cslp_settings.hit_url_copy == true) {
                                                copy_url(cslt_target_tweet_elem);
                                            }
                                        }
                                    }
                                }
                                night_spam_processed_flag = true;
                            }
                            //TwitterCard動画付処理
                            if(cslt_tweet_info_obj.tw_card_unified_obj?.destination_objects?.browser_with_docked_media_1?.data?.url_data != undefined){
                                const video_card_url_data = cslt_tweet_info_obj.tw_card_unified_obj?.destination_objects?.browser_with_docked_media_1?.data?.url_data;
                                const video_card_url = new URL(video_card_url_data.url);
                                if(block_regexp.test(video_card_url.host)){
                                    if (cslp_settings.hit_del == true && !cslt_tweet_info_obj.is_root_tweet) {
                                        //ヒットツイート非表示有効&元ツイートでない場合非表示
                                        night_spam_processed_flag = true;
                                        cslt_target_tweet_elem.setAttribute("cslt_hide_flag", "true");
                                        cslt_target_tweet_elem.textContent = "";
                                    } else {
                                        const ins_html = `<div class="cslt_spam_link_found" style="position: absolute;z-index: 99999;width: 100%;height: 101%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 5px 5px 5px 5px;"><p>スパムを検出!<br>ヒットしたURL:${video_card_url.host}<br>クリックでツイートを開く</p></div>`;
                                        const night_spam_twitter_card_elem = cslt_target_tweet_elem.querySelector(`div[aria-labelledby][id]`);
                                        if (night_spam_twitter_card_elem != null) {
                                            night_spam_twitter_card_elem.insertAdjacentHTML("afterbegin", ins_html);
                                            if (cslp_settings.hit_url_copy == true) {
                                                copy_url(cslt_target_tweet_elem);
                                            }
                                        }
                                    }
                                }
                            }
                            if (night_spam_processed_flag) {
                                cslt_target_tweet_elem.setAttribute("cslt_night_spam_processed_flag", "true");
                                continue;
                            }
                        }
                        cslt_target_tweet_elem.setAttribute("cslt_process_ok", "true");
                    }//1要素あたりの動作終了
                    /*const cslt_performance_logging_end = performance.now();
                    cslt_performance_logging.push(cslt_performance_logging_end - cslt_performance_logging_start);
                    console.log(cslt_performance_logging)*/
                };//メイン動作関数終了

                /* MutationObserverによる監視 */
                if (JSON.parse(cslp_settings.filter) == true) {
                    const observer = new MutationObserver(run)
                    observer.observe(target_elem, {
                        childList: true,
                        attributes: true,
                        characterData: true,
                        subtree: true,
                        attributeOldValue: true,
                        characterDataOldValue: true
                    });
                }
                /* 以下非表示以外の機能用関数 */
                //報告・ブロック機能用関数
                function report_btn_init(target_tweet_elem, mode, notification_users_data){
                    const is_timeline_report_btn = is_timeline_follow_report();
                    if (cslp_settings.oneclick_report == true && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '3' && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '4' && is_timeline_report_btn != true || cslp_settings.oneclick_report_after_mode == '5' && cslp_settings.oneclick_developer_report == true && is_timeline_report_btn != true) {
                        switch (mode) {
                            case "notification":
                                //console.log(notification_users_data)
                                target_tweet_elem.querySelector('article').insertAdjacentHTML("beforeend", `<div class="cslt_report_icon_notification_wrap"></div>`);
                                for (let notification_users_index = 0; notification_users_index < notification_users_data.user_data_array.length; notification_users_index++) {
                                    report_init(target_tweet_elem, "notification", notification_users_data.user_data_array[notification_users_index]);
                                }
                                break;
                            case "user_page":
                                report_init(target_tweet_elem, "user_page", notification_users_data.user_data_array[0]);
                                break;
                            default:
                                if (is_follow_page()) {
                                    report_init(target_tweet_elem, "follow", null);
                                } else {
                                    if (!cslp_settings.oneclick_report_btn_set_tweetmore) {
                                        //もっと見る付近配置モードオフ
                                        report_init(target_tweet_elem, "share", null);
                                    } else {
                                        report_init(target_tweet_elem, "more", null);
                                    }
                                }
                                break;
                        }
                        /*if(mode != "notification"){
                            if (is_follow_page()) {
                                report_init(target_tweet_elem, "follow");
                            } else {
                                if (!cslp_settings.oneclick_report_btn_set_tweetmore) {
                                    //もっと見る付近配置モードオフ
                                    report_init(target_tweet_elem, "share");
                                } else {
                                    report_init(target_tweet_elem, "more");
                                }
                            }
                        }else{
                            //console.log(notification_users_data)
                            target_tweet_elem.querySelector('article').insertAdjacentHTML("beforeend", `<div class="cslt_report_icon_notification_wrap"></div>`);
                            for (let notification_users_index = 0; notification_users_index < notification_users_data.user_data_array.length; notification_users_index++) {
                                report_init(target_tweet_elem, "notification", notification_users_data.user_data_array[notification_users_index]);
                            }
                        }*/
                        target_tweet_elem.setAttribute("cslt_report_btn_set_flag", "true");
                    }
                }
                function report_init(input_element, btn_mode, notification_user_page_data) {
                    let reply_elem = null;
                    //let is_follow_page = is_follow_page();
                    let is_community_page = false;
                    /*if(window.location.pathname.split("/")[2]?.match(/(followers|following|verified_followers)/g)?.length == 1 || window.location.pathname.split("/")[4]?.match(/(retweets|likes)/g)?.length == 1){
                        is_follow_page = true;
                    }*/
                    if (window.location.pathname.split("/")[2] == 'communities') {
                        is_community_page = true;
                    }
                    /*if(is_follow_page == true && cslp_settings.oneclick_report_follow_list == true){
                        reply_elem = document.querySelectorAll('div[data-testid="cellInnerDiv"]:not([cslt_flag="report_ok"])');
                    }else{
                        reply_elem = document.querySelectorAll('article[tabindex="0"] div[role="group"]:not([cslt_flag="report_ok"])');
                    }*/
                    const random_id = Math.random().toString(32).substring(2).replaceAll(/[0-9]/g, "") + Math.random().toString(32).substring(2);
                    //フォロー中とユーザー検索ページで等ボタン表示
                    if (is_follow_page() || is_status_rt() && cslp_settings.oneclick_report_follow_list == true || window.location.search.match(/f=user/g)?.length == 1 && cslp_settings.oneclick_report_follow_list == true) {
                        if (cslp_settings.imp_user_block == true && cslp_settings.follow_list_imp_find_user == true) {
                            const follower_user_id = input_element.querySelector('[data-testid="UserCell"] a[role="link"]')?.href.replace(/(https:\/\/x.com\/|https:\/\/twitter.com\/)/g, "");
                            if (imp_user_block_list_regexp.test(follower_user_id) && input_element.querySelector('[data-testid="UserCell"]').getAttribute("cslt_flag") != "follower_imp_ok") {
                                input_element.querySelector('[data-testid="UserCell"]').setAttribute("cslt_flag", "follower_imp_ok");
                                input_element.querySelector('[data-testid="UserCell"]').style.backgroundColor = "#ffb9ad";
                                input_element.querySelector('[data-testid="UserCell"]').title = "CSLTのインプレフィルターによりスパムとしてマークされています";
                            } else {
                                input_element.querySelector('[data-testid="UserCell"]')?.setAttribute("cslt_flag", "follower_imp_ok");
                            }
                        }
                        input_element.querySelector('[data-testid="UserCell"]')?.insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                    } else {
                        const is_input_elem_li = input_element.tagName === 'LI';
                        //"follow"
                        switch (btn_mode) {
                            case "follow":
                                //新クライアントは現状、調査ができないので一旦無効にしておく
                                if (!is_new_client){
                                    input_element.querySelector('[data-testid="UserCell"]').insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                                }
                                break;
                            case "share":
                                //従来のボタン配置
                                if(is_input_elem_li){
                                    input_element.querySelector('button[id^="base-ui-"]:not([cslt_flag="report_ok"])').insertAdjacentHTML("afterend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                                }else{
                                    input_element.querySelector('div[role="group"]:not([cslt_flag="report_ok"])').insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                                }
                                break;
                            case "more":
                                //もっと見る付近に配置
                                if(is_input_elem_li){
                                    input_element.querySelector('button[aria-haspopup="dialog"]:has(svg[data-icon="icon-more"])').insertAdjacentHTML("afterend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a>`);
                                }else{
                                    input_element.querySelector('article').insertAdjacentHTML("beforeend", `<div class="cslt_report_icon_tweetmore_wrap"><a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="報告"></a></div>`);
                                }
                                break;
                            case "notification":
                                //新クライアントは現状、調査ができないので一旦無効にしておく
                                if (!is_new_client){
                                    input_element.querySelector('.cslt_report_icon_notification_wrap').insertAdjacentHTML("beforeend", `<a cslt_report_btn id="${random_id}" class="cslt_report_icon" title="${notification_user_page_data.user_data.name}(@${notification_user_page_data.user_data.scr_name})を報告"></a>`);
                                }
                                break;
                            case "user_page":
                                //新クライアントは現状、調査ができないので一旦無効にしておく
                                if (!is_new_client){
                                    input_element.closest('div[aria-label][tabindex="0"]').querySelector('button[data-testid="userActions"][aria-haspopup="menu"][role="button"]').insertAdjacentHTML("afterend", `<a cslt_report_btn id="${random_id}" class="cslt_report_user_page" title="このユーザーを報告"><div class="cslt_report_icon"></div></a>`);
                                }
                                break;
                            default:

                                break;
                        }
                    }
                    if (input_element.querySelector(".cslt_report_icon") != null) {
                        input_element.setAttribute("cslt_flag", "report_ok");
                    }
                    //ツイート情報コピー
                    if (cslp_settings.hit_url_copy == true && btn_mode != "notification") {
                        //URLコピー用要素追加
                        let tweet_info_copy_ins_html = `<div id="cslt_tweet_info_copy_${random_id}" class="cslt_tweetdata_copy" style="width: 100%;height: 100%;position: absolute;z-index: 100;display: flex;align-items: center;text-align: center;justify-content: center;font-weight:bold;background-color: rgba(0,0,0,0.75);color: #fff;outline:solid 5px #1173ff;outline-offset:-5px;cursor:copy;visibility:hidden;">クリックで情報をコピー</div>`;
                        const reply_elem_user_cell_copy = input_element.closest('[data-testid="cellInnerDiv"], [data-testid="UserCell"]:not([cslt_copy_tweet_data_success])');
                        reply_elem_user_cell_copy.insertAdjacentHTML("afterbegin", tweet_info_copy_ins_html);
                        copy_tweet_data(reply_elem_user_cell_copy.getAttribute("cslt_tweet_info"), `cslt_tweet_info_copy_${random_id}`);
                        reply_elem_user_cell_copy.setAttribute('cslt_copy_tweet_data_success', '');
                    }
                    //報告ボタン動作
                    document.getElementById(random_id)?.addEventListener("click", async function () {
                        //非ログイン状態では報告機能諸々は利用できないので早期にreturnしておく
                        const ct0 = await ct0_token_get(location.host)
                        if (!ct0){
                            systemMessagePanel.setMessage(`ログインされていないため報告ボタンは機能しません`, "error");
                            return;
                        };

                        let get_cookie_twid = null;
                        //ログインユーザーID取得
                        if (is_use_cookie_mode()) {
                            get_cookie_twid = decodeURIComponent(document.cookie.split(";").find(cookie => /twid=/.test(cookie))).replace("twid=u=", "");
                        } else {
                            get_cookie_twid = await new Promise((resolve) => {
                                chrome.runtime.sendMessage({ message: { mode: "login_userid_get", target: { target_host_mode: location.host } } }, (response) => {
                                    resolve(decodeURIComponent(response).replace("u=", ""));
                                });
                            });
                        }
                        //
                        let report_confirm = false;
                        if (cslp_settings.oneclick_report_confirm == true) {
                            if (confirm("操作を実行しますか?")) {
                                report_confirm = true;
                            }
                        } else {
                            report_confirm = true;
                        }
                        if (report_confirm == true) {
                            const report_srvurl = cslp_settings.oneclick_developer_reportsrv_url;
                            //console.log(random_id);
                            const target_element = this.closest('[data-testid="cellInnerDiv"], li[cslt_tweet_info]');
                            //console.log(target_element)
                            let tweet_info = null;
                            switch (btn_mode) {
                                case "notification":
                                    tweet_info = notification_user_page_data;
                                    break;
                                case "user_page":
                                    tweet_info = notification_user_page_data;
                                    //console.log(this)
                                    break;
                                default:
                                    tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                    break;
                            }
                            /*if(btn_mode != "notification"){
                                tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                            }else{
                                tweet_info = notification_user_page_data;
                            }*/
                            let report_result = false;
                            let block_mute_result = false;
                            let fail_report_success_bm = false;
                            //CSLT側の非表示リスト追加用処理
                            let add_hide_user_list_scr_name = null;
                            if (cslp_settings.oneclick_report_add_cslt_hideuser) {
                                add_hide_user_list_scr_name = tweet_info.user_data.scr_name;
                            }
                            
                            //console.log(get_cookie_twid)
                            if (get_cookie_twid != tweet_info.user_data.user_id || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4' || cslp_settings.oneclick_report_after_mode == '5') {
                                if (cslp_settings.oneclick_report == true) {
                                    if (Number(cslp_settings.oneclick_report_after_mode) <= 2) {
                                        //報告処理
                                        if (is_community_page != true) {
                                            //コミュニティ内ではない場合
                                            const report_tweet_run = await new Promise((resolve) => {
                                                //console.log(tweet_info.tweet_id)
                                                //console.log(tweet_info)
                                                if (!is_follow_page()) {
                                                    switch (btn_mode) {
                                                        case "notification":
                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", true, tweet_info).then((report_status) => {
                                                                resolve(report_status);
                                                            });
                                                            break;
                                                        case "user_page":
                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"none", true, tweet_info).then((report_status) => {
                                                                resolve(report_status);
                                                            });
                                                            break;
                                                        default:
                                                            switch (cslp_settings.oneclick_report_target_mode) {
                                                                case "0":
                                                                    if(tweet_info?.is_user_data_only != undefined){
                                                                        if(!tweet_info.is_user_data_only){
                                                                            systemMessagePanel.setMessage("投稿の報告のみを行います", "info");
                                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host,"none", false, null).then((report_status) => {
                                                                                resolve(report_status);
                                                                            });
                                                                        }else{
                                                                            systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                                resolve(report_status);
                                                                            });
                                                                        }
                                                                    }
                                                                    
                                                                    break;
                                                                case "1":
                                                                    systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                                    report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                        resolve(report_status);
                                                                    });
                                                                    break;
                                                                case "2":
                                                                    if(tweet_info?.is_user_data_only != undefined){
                                                                        if(!tweet_info.is_user_data_only){
                                                                            //返信報告
                                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host,"none", false, null).then((report_status) => {
                                                                                systemMessagePanel.setMessage("ユーザーの報告を行います", "info");
                                                                                //ユーザー報告
                                                                                report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                                    resolve(report_status);
                                                                                });
                                                                            });
                                                                        }else{
                                                                            systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                                            report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                                resolve(report_status);
                                                                            });
                                                                        }
                                                                    }else{
                                                                        //console.log("isReplyNotFound")
                                                                    }
                                                                    break;
                                                                default:
                                                                    report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host,"none", false, null).then((report_status) => {
                                                                        resolve(report_status);
                                                                    });
                                                                    break;
                                                            }
                                                            break;
                                                    }
                                                } else {
                                                    //フォロー欄などのユーザーを報告した場合
                                                    systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                    report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                        resolve(report_status);
                                                    });
                                                }
                                            });
                                            if (report_tweet_run != true) {
                                                this.classList.add("cslt_report_fail");
                                            } else {
                                                report_result = true;
                                            }
                                        } else {
                                            //コミュニティ内である場合
                                            const report_tweet_run = await new Promise((resolve) => {
                                                //
                                                switch (cslp_settings.oneclick_report_target_mode) {
                                                    case "0":
                                                        systemMessagePanel.setMessage("投稿の報告のみを行います", "info");
                                                            report_tweet_community(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host).then((report_status) => {
                                                                resolve(report_status);
                                                            });
                                                        break;
                                                    case "1":
                                                        systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                        report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                            resolve(report_status);
                                                        });
                                                        break;
                                                    case "2":
                                                        if(tweet_info?.is_user_data_only != undefined){
                                                            if(!tweet_info.is_user_data_only){
                                                                report_tweet_community(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host).then((report_status) => {
                                                                    //ユーザー報告
                                                                    report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                        resolve(report_status);
                                                                    });
                                                                });
                                                            }else{
                                                                systemMessagePanel.setMessage("ユーザーの報告のみを行います", "info");
                                                                report_tweet(cslp_settings.oneclick_report_option, target_element, tweet_info.user_data.user_id, location.host,"user", false, null).then((report_status) => {
                                                                    resolve(report_status);
                                                                });
                                                            }
                                                        }
                                                        break;
                                                    default:
                                                        report_tweet_community(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host).then((report_status) => {
                                                            resolve(report_status);
                                                        });
                                                        break;
                                                }
                                                /*
                                                report_tweet_community(cslp_settings.oneclick_report_option, target_element, tweet_info.tweet_id, location.host).then((report_status) => {
                                                    resolve(report_status);
                                                });*/
                                            });
                                            //console.log(report_tweet_run);
                                            if (report_tweet_run != true) {
                                                this.classList.add("cslt_report_fail");
                                            } else {
                                                report_result = true;
                                            }
                                        }
                                        //報告完了IDを保存
                                        if (report_result == true) {
                                            report_ids_temp(tweet_info.tweet_id, "report");
                                        }
                                        //
                                        if (cslp_settings.oneclick_report_after_mode == "1") {
                                            //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                            //console.log(target_element.getAttribute("cslt_tweet_info"));
                                            const mute_tweet_run = await new Promise((resolve) => {
                                                mute_user(tweet_info.user_data.user_id, add_hide_user_list_scr_name, location.host).then((report_status) => {
                                                    resolve(report_status);
                                                });
                                            });
                                            if (mute_tweet_run != true) {
                                                this.classList.add("cslt_report_fail");
                                            } else {
                                                block_mute_result = true;
                                            }
                                            //ミュート済ユーザーIDを保存
                                            if (mute_tweet_run == true) {
                                                report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                            }
                                            //
                                        }
                                        if (cslp_settings.oneclick_report_after_mode == "2") {
                                            //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                            //console.log(target_element.getAttribute("cslt_tweet_info"));
                                            const block_user_run = await new Promise((resolve) => {
                                                block_user(tweet_info.user_data.user_id, add_hide_user_list_scr_name, location.host).then((resp) => {
                                                    resolve(resp);
                                                });
                                            });
                                            if (block_user_run == true) {
                                                block_mute_result = true;
                                            }
                                            //console.log(block_user_run)
                                            //ブロック済ユーザーIDを保存
                                            if (block_user_run == true) {
                                                report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                            }
                                            //
                                        }
                                        if (cslp_settings.oneclick_developer_report == true) {
                                            //開発者情報提供
                                            if (!tweet_info?.is_user_data_only && btn_mode != "notification" && is_follow_page() == false) {
                                                developer_spam_user_share(report_srvurl, target_element);
                                                systemMessagePanel.setMessage("情報提供の処理を行いました", "info");
                                            }
                                        }
                                        //this.classList.add("cslt_report_complete");
                                    }
                                }
                                if (cslp_settings.oneclick_report_after_mode == '3') {
                                    if (get_cookie_twid != tweet_info.user_data.user_id) {
                                        if (cslp_settings.oneclick_developer_report == true) {
                                            //開発者情報提供
                                            if (!tweet_info?.is_user_data_only && btn_mode != "notification" && is_follow_page() == false) {
                                                developer_spam_user_share(report_srvurl, target_element);
                                                systemMessagePanel.setMessage("情報提供の処理を行いました", "info");
                                            }
                                        }
                                        //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                        //console.log(target_element.getAttribute("cslt_tweet_info"));
                                        const mute_tweet_run = await new Promise((resolve) => {
                                            mute_user(tweet_info.user_data.user_id, add_hide_user_list_scr_name, location.host).then((report_status) => {
                                                resolve(report_status);
                                            });
                                        });
                                        if (mute_tweet_run != true) {
                                            this.classList.add("cslt_report_fail");
                                        } else {
                                            block_mute_result = true;
                                        }
                                        //ミュート済ユーザーIDを保存
                                        if (mute_tweet_run == true) {
                                            report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                        }
                                        //
                                    } else {
                                        document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                        systemMessagePanel.setMessage("自身のツイートにこの操作はできません", "error");
                                    }
                                }
                                if (cslp_settings.oneclick_report_after_mode == '4') {
                                    if (get_cookie_twid != tweet_info.user_data.user_id) {
                                        if (cslp_settings.oneclick_developer_report == true) {
                                            //開発者情報提供
                                            if (!tweet_info?.is_user_data_only && btn_mode != "notification" && is_follow_page() == false) {
                                                developer_spam_user_share(report_srvurl, target_element);
                                                systemMessagePanel.setMessage("情報提供の処理を行いました", "info");
                                            }
                                        }
                                        //const tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
                                        //console.log(target_element.getAttribute("cslt_tweet_info"));
                                        const block_user_run = await new Promise((resolve) => {
                                            block_user(tweet_info.user_data.user_id, add_hide_user_list_scr_name, location.host).then((resp) => {
                                                resolve(resp);
                                            });
                                        });
                                        /*if(block_user_run == true){
                                            block_mute_result = true;
                                        }*/
                                        if (block_user_run != true) {
                                            this.classList.add("cslt_report_fail");
                                        } else {
                                            block_mute_result = true;
                                        }
                                        //ブロック済ユーザーIDを保存
                                        if (block_user_run == true) {
                                            report_ids_temp(tweet_info.user_data.user_id, "block_mute");
                                        }
                                        //
                                    } else {
                                        document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                        systemMessagePanel.setMessage("自身のツイートにこの操作はできません", "error");
                                    }
                                }
                                //開発者情報提供は通知とユーザーページでは無効とする
                                if(btn_mode != "notification" || btn_mode != "user_page"){
                                    if (cslp_settings.oneclick_developer_report == true && cslp_settings.oneclick_report_after_mode == '5') {
                                        //開発者情報提供
                                        if (get_cookie_twid != tweet_info.user_data.user_id) {
                                            //アカウント蓄積
                                            //console.log(JSON.stringify(imp_account))
                                            if (is_follow_page() == false) {
                                                developer_spam_user_share(report_srvurl, target_element);
                                                tweet_area_clear(target_element, "report_only");
                                                systemMessagePanel.setMessage("情報提供の処理を行いました", "info");
                                            }
                                            //this.classList.add("cslt_report_complete");
                                        } else {
                                            document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                            systemMessagePanel.setMessage("自身のツイートにこの操作はできません", "error");
                                        }
                                    }
                                }
                                //報告は失敗したが、ブロックミュートが成功した場合、一時保存から削除
                                if (cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2') {
                                    if (report_result == false && block_mute_result == true) {
                                        report_ids_temp(tweet_info.tweet_id, "fail_report_delete");
                                        fail_report_success_bm = true;
                                    }
                                }
                                //処理後にツイート非表示
                                if (cslp_settings.oneclick_report == true || cslp_settings.oneclick_report_after_mode == '1' || cslp_settings.oneclick_report_after_mode == '2' || cslp_settings.oneclick_report_after_mode == '3' || cslp_settings.oneclick_report_after_mode == '4') {
                                    if (fail_report_tweet_status_ids_regex.test(tweet_info.tweet_id) == false && report_result == true || fail_block_mute_user_ids_regex.test(tweet_info.tweet_id) == false && block_mute_result == true || fail_report_success_bm == true) {
                                        //console.log(fail_report_tweet_status_ids_regex.test(tweet_info.tweet_id));
                                        switch (btn_mode) {
                                            case "notification":
                                                systemMessagePanel.setMessage("通知のため、非表示処理はスキップされます", "info");
                                                break;
                                            case "user_page":
                                                systemMessagePanel.setMessage("ブロック/ミュート処理は、再読み込みで反映を確認可能です", "info");
                                                break;
                                            default:
                                                if (cslp_settings.oneclick_report == true && cslp_settings.oneclick_report_after_mode == '0') {
                                                    tweet_area_clear(target_element, "report_only");
                                                } else {
                                                    tweet_area_clear(target_element, "mute_block");
                                                }
                                                break;
                                        }
                                        /*if(btn_mode != "notification"){
                                            if (cslp_settings.oneclick_report == true && cslp_settings.oneclick_report_after_mode == '0') {
                                                tweet_area_clear(target_element, "report_only");
                                            } else {
                                                tweet_area_clear(target_element, "mute_block");
                                            }
                                        }*/
                                    }
                                }
                                //this.classList.add("cslt_report_complete");
                            } else {
                                document.querySelector('[id="layers"] div[role="group"] div div')?.click();
                                systemMessagePanel.setMessage("自身のツイートにこの操作はできません", "error");
                            }
                        }
                    })
                }
                //URLコピー関数(ナイト系スパム関連。レガシー)
                function copy_url(input_element) {
                    //コピー変数
                    let copy_tw_id = null;
                    let copy_tw_date = null;
                    let copy_t_co_addr = null;
                    let copy_base_addr = null
                    let copy_adv_resp_addr = null;
                    //コピーボタン追加
                    const copy_btn_random_id = generate_random_id();
                    let debug_ins_html = `<div id="${copy_btn_random_id}" class="cslt_copy_filter" style="width: 100%;height: 100%;position: absolute;z-index: 100;display: flex;align-items: center;text-align: center;justify-content: center;font-weight:bold;background-color: rgba(0,0,0,0.75);color: #fff;outline:solid 5px #ffab11;outline-offset:-5px;cursor:copy;visibility:hidden;">クリックでURLをコピー</div>`;
                    input_element.insertAdjacentHTML("afterbegin", debug_ins_html);
                    //コピーイベント
                    document.getElementById(copy_btn_random_id).addEventListener("click", function () {
                        //console.log(this)
                        //ツイート情報取得
                        const get_tw_id_url = new URL(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"]  a[dir="ltr"], div[dir="ltr"] [aria-describedby][role="link"]').href);
                        const get_tw_date = new Date(this.closest('[data-testid="cellInnerDiv"]').querySelector('[data-testid="User-Name"] a[dir="ltr"] time, div[dir="ltr"] [aria-describedby][role="link"] time').getAttribute("datetime"));
                        copy_tw_id = get_tw_id_url.pathname.match("/status/(\\d+)")[1];
                        copy_tw_date = `${get_tw_date.getFullYear()}_${(get_tw_date.getMonth() + 1).toString().padStart(2, '0')}_${get_tw_date.getDate().toString().padStart(2, '0')}_${get_tw_date.getHours()}_${get_tw_date.getMinutes()}_${get_tw_date.getSeconds()}`;
                        //アドバンスドURL解析
                        if (cslp_settings.hit_url_copy_advanced == true) {
                            let target_element_a = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a');
                            let target_url = null;
                            //アドバンスド解析ベースのコピーモード
                            if (this.parentElement.querySelectorAll('[data-testid="tweetText"] a').length != 0) {
                                target_element_a = this.parentElement.querySelectorAll('[data-testid="tweetText"] a');
                            }
                            if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a').length != 0) {
                                target_element_a = this.parentElement.querySelectorAll('[data-testid="card.wrapper"] a');
                            }
                            //console.log(target_element_a)
                            for (let index = 0; index < target_element_a.length; index++) {
                                if (target_element_a[index].href.match("twitter.com") == null) {
                                    if (target_element_a[index].href.match("t.co") != null) {
                                        //console.log(target_element_a[index].href);
                                        target_url = target_element_a[index].href;
                                        break;
                                    } else {
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
                                chrome.runtime.sendMessage({ message: { mode: "advanced_check", target: tco_addr } }, (response) => {
                                    if (cslp_settings.hit_url_copy_mode != "3") {
                                        //console.log(response);
                                        if (Array.isArray(response.url) == true) {
                                            let filtered_array = new Array();
                                            if (cslp_settings.hit_url_copy_advanced_filter == true) {
                                                for (let index = 0; index < response.url.length; index++) {
                                                    if (response.url[index].match(response.base_url + "|" + advanced_regexp) == null) {
                                                        //console.log(response.url[index]);
                                                        filtered_array.push(response.url[index]);
                                                    }
                                                }
                                                let filtered_array_concat = response.base_url + "," + filtered_array.join(",");
                                                navigator.clipboard.writeText(filtered_array_concat).then(() => {
                                                    hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型・フィルタ済)\r\n他の拡張機能との競合や広告である可能性があります。\r\nCopy->${filtered_array_concat}`);
                                                });
                                            } else {
                                                let array_concat = response.base_url + "," + response.url.join(",");
                                                navigator.clipboard.writeText(array_concat).then(() => {
                                                    hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型)\r\n他の拡張機能との競合や広告である可能性があります。\r\nCopy->${array_concat}`);
                                                });
                                            }
                                        } else {
                                            let concat_urls = response.base_url + "," + response.url;
                                            navigator.clipboard.writeText(concat_urls).then(() => {
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト型)\r\n他の拡張機能との競合や広告である可能性があります。\r\nnCopy->${concat_urls}`);
                                            });
                                        }
                                    } else {
                                        if (Array.isArray(response.url) == true) {
                                            let filtered_array = new Array();
                                            if (cslp_settings.hit_url_copy_advanced_filter == true) {
                                                for (let index = 0; index < response.url.length; index++) {
                                                    if (response.url[index].match(response.base_url + "|" + advanced_regexp) == null) {
                                                        //console.log(response.url[index]);
                                                        filtered_array.push(response.url[index]);
                                                    }
                                                }
                                                copy_t_co_addr = target_url;
                                                copy_base_addr = response.base_url;
                                                copy_adv_resp_addr = filtered_array.join(",");
                                            } else {
                                                copy_t_co_addr = target_url;
                                                copy_base_addr = response.base_url;
                                                copy_adv_resp_addr = response.url.join(",");
                                            }
                                        } else {
                                            copy_t_co_addr = target_url;
                                            copy_base_addr = response.base_url;
                                            copy_adv_resp_addr = response.url;
                                        }
                                        const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                        navigator.clipboard.writeText(copy_text).then(() => {
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。`);
                                        });
                                    }
                                });
                            } else {
                                let tco_addr = target_url;
                                //console.log(tco_addr)
                                chrome.runtime.sendMessage({ message: { mode: "advanced_check", target: tco_addr } }, (response) => {
                                    if (cslp_settings.hit_url_copy_mode != "3") {
                                        //console.log(response);
                                        //console.log(response.url);
                                        if (Array.isArray(response.url) == true) {
                                            let filtered_array = new Array();
                                            if (cslp_settings.hit_url_copy_advanced_filter == true) {
                                                //console.log(advanced_regexp)
                                                for (let index = 0; index < response.url.length; index++) {
                                                    if (response.url[index].match(response.base_url + "|" + advanced_regexp) == null) {
                                                        //console.log(response.url[index]);
                                                        filtered_array.push(response.url[index]);
                                                    }
                                                }
                                                let filtered_array_concat = response.base_url + "," + filtered_array.join(",");
                                                navigator.clipboard.writeText(filtered_array_concat).then(() => {
                                                    hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型・フィルタ済)\r\nCopy->${filtered_array_concat}`);
                                                });
                                            } else {
                                                let array_concat = response.base_url + "," + response.url.join(",");
                                                navigator.clipboard.writeText(array_concat).then(() => {
                                                    hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト不可型)\r\nCopy->${array_concat}`);
                                                });
                                            }
                                        } else {
                                            let concat_urls = response.base_url + "," + response.url;
                                            navigator.clipboard.writeText(concat_urls).then(() => {
                                                hide_cp_msg(`クリップボードにURLをコピーしました!(リダイレクト型)\r\nCopy->${concat_urls}`);
                                            });
                                        }
                                    } else {
                                        if (Array.isArray(response.url) == true) {
                                            let filtered_array = new Array();
                                            if (cslp_settings.hit_url_copy_advanced_filter == true) {
                                                //console.log(advanced_regexp)
                                                for (let index = 0; index < response.url.length; index++) {
                                                    if (response.url[index].match(response.base_url + "|" + advanced_regexp) == null) {
                                                        //console.log(response.url[index]);
                                                        filtered_array.push(response.url[index]);
                                                    }
                                                }
                                                copy_t_co_addr = target_url;
                                                copy_base_addr = response.base_url;
                                                copy_adv_resp_addr = filtered_array.join(",");
                                            } else {
                                                copy_t_co_addr = target_url;
                                                copy_base_addr = response.base_url;
                                                copy_adv_resp_addr = response.url.join(",");
                                            }
                                        } else {
                                            copy_t_co_addr = target_url;
                                            copy_base_addr = response.base_url;
                                            copy_adv_resp_addr = response.url;
                                        }
                                        const copy_text = cslp_settings.hit_url_copy_user_text.replaceAll("%t_co%", copy_t_co_addr).replaceAll("%bl_url%", copy_base_addr).replaceAll("%adv_addr%", copy_adv_resp_addr).replaceAll("%tw_id%", copy_tw_id).replaceAll("%tw_date%", copy_tw_date);
                                        navigator.clipboard.writeText(copy_text).then(() => {
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}`);
                                        });
                                    }
                                });
                            }
                        } else {
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
                            function get_tco_new(input_element) {
                                let target_element_a = input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a , [data-testid="tweetText"] a');
                                let target_url = null;
                                if (input_element.parentElement.querySelectorAll('[data-testid="tweetText"] a').length != 0) {
                                    target_element_a = input_element.parentElement.querySelectorAll('[data-testid="tweetText"] a');
                                }
                                if (input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a').length != 0) {
                                    target_element_a = input_element.parentElement.querySelectorAll('[data-testid="card.wrapper"] a');
                                }
                                //console.log(target_element_a)
                                for (let index = 0; index < target_element_a.length; index++) {
                                    if (target_element_a[index].href.match("twitter.com") == null) {
                                        if (target_element_a[index].href.match("t.co") != null) {
                                            //console.log(target_element_a[index].href);
                                            target_url = target_element_a[index].href;
                                            break;
                                        } else {
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
                                            navigator.clipboard.writeText(url).then(() => {
                                                hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${url}`);
                                            });
                                        });
                                    }
                                    break;
                                case "1":
                                    if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                        navigator.clipboard.writeText(adv_tco_addr).then(() => {
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスでコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                        });
                                    } else {
                                        navigator.clipboard.writeText(adv_tco_addr).then(() => {
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr}`);
                                        });
                                    }
                                    break;
                                case "2":
                                    if (adv_tco_addr.match(/([^\/]+)/g)[1] != "t.co") {
                                        navigator.clipboard.writeText(`${adv_tco_addr},${adv_tco_addr}`).then(() => {
                                            hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${adv_tco_addr},${adv_tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。\r\n解析モードをオンにする事で解決できる可能性があります。`);
                                        });
                                    } else {
                                        get_blockurl(adv_tco_addr).then(function (url) {
                                            let cl_text = `${url},${adv_tco_addr}`;
                                            //console.log(cl_text);
                                            navigator.clipboard.writeText(cl_text).then(() => {
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
                                        navigator.clipboard.writeText(copy_text).then(() => {
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
                                            navigator.clipboard.writeText(copy_text).then(() => {
                                                hide_cp_msg(`クリップボードにURLをコピーしました!\r\n${copy_text}`);
                                            });
                                        })
                                    }
                                    break;
                            }
                        }
                        function hide_cp_msg(message) {
                            if (confirm(message)) {
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                                }
                                shift_key_status = 0;
                            } else {
                                for (let index = 0; index < document.getElementsByClassName("cslt_copy_filter").length; index++) {
                                    document.getElementsByClassName("cslt_copy_filter")[index].style.visibility = "hidden";
                                }
                                shift_key_status = 0;
                            }
                        }
                    });
                }
            }
            function copy_tweet_data(element_json, target_id) {
                document.getElementById(target_id).addEventListener("click", function () {
                    const copy_obj = JSON.parse(element_json);
                    delete copy_obj.report_json;
                    const copy_json = JSON.stringify(copy_obj);
                    navigator.clipboard.writeText(copy_json).then(() => {
                        //console.log(copy_json)
                        systemMessagePanel.setMessage("クリップボードにJSONをコピーしました", "info");
                    });
                });
            }
        })
        /* リスト読み込み後の動作終了 */
    }).catch(error => {
        console.error('List load error!', error);
    });
}
/*報告やその他追加機能用の関数*/
//報告関数
async function report_tweet(report_mode, report_element, report_twid, host_mode, reply_report_target, report_notification_user_page, notification_users_data) {
    //report_target_elem.querySelector('[aria-haspopup="menu"][data-testid="caret"]').click();
    let access_host = "x.com";
    if (host_mode == "twitter.com") {
        access_host = "twitter.com";
    }
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const report_mode_conv = Number(report_mode);
    let tweet_info_obj = null;
    //console.log(tweet_info_obj)
    if(report_notification_user_page){
        tweet_info_obj = notification_users_data;
    }else{
        tweet_info_obj = JSON.parse(report_element.getAttribute("cslt_tweet_info"));
    }
    let report_json_obj = null;
    let report_req_obj = null;
    let user_report_json_obj = null;
    let report_first_json_body = null;
    switch (reply_report_target) {
        case "user":
            user_report_json_obj = JSON.parse(tweet_info_obj.user_report_json);
            report_req_obj = JSON.parse(user_report_json_obj.input_flow_data.requested_variant);
            report_first_json_body = tweet_info_obj.user_report_json.replaceAll("%cslt_random_uuid%", crypto.randomUUID());
            break;
        default:
            report_json_obj = JSON.parse(tweet_info_obj.report_json);
            report_req_obj = JSON.parse(report_json_obj.input_flow_data.requested_variant);
            report_first_json_body = tweet_info_obj.report_json.replaceAll("%cslt_random_uuid%", crypto.randomUUID());
            break;
    }
    //console.log(report_req_obj)
    //プロモーションの場合関数終了
    if (report_req_obj.is_promoted == true) {
        systemMessagePanel.setMessage(`広告のため報告はスキップされます`, "warning");
        return true;
    }
    const get_ct0_token = await new Promise((resolve) => {
        ct0_token_get(location.host).then(async function (ct0_token) {
            resolve(ct0_token);
        });
    });
    //報告送信関数
    async function send_second_report(response_obj) {
        const get_csrf_token = await new Promise((resolve) => {
            ct0_token_get(location.host).then((response) => {
                resolve(response);
            });
        });
        return new Promise((resolve) => {
            let now_steps = 1;
            let report_finalize = false;
            let user_choice = report_mode_conv;
            let choice_convert_flag = false;
            
            send_srv(response_obj);
            function send_srv(input_response) {
                const input_token_convert = decodeURIComponent(input_response.flow_token).replaceAll("=", "");
                let report_second_stage_body = null;

                //旧報告UI向けのオプションをフォールバックする
                if(now_steps === 1 && !input_response.subtasks[0].choice_selection.choices.some(option => option.id === "SpamSimpleOption")){
                    if(!choice_convert_flag && now_steps === 1 && input_response.subtasks[0].choice_selection?.choices[8]?.id !== "ShownSensitiveDisturbingMediaOption"){
                        if(user_choice === 8){
                            //この条件が古くなっている可能性があるが、ページによって項目が変わってくる仕様のため、念の為残しておく
                            //ステップ1の項目が10種類の場合、「攻撃的な行為や嫌がらせ」にセンシティブが含まれているので切り替える
                            user_choice = 1;
                            choice_convert_flag = true;
                        }
                    }
                    if(!choice_convert_flag && now_steps === 1 && input_response.subtasks[0].choice_selection?.choices[8]?.id === "DeceptiveIdentitiesOption"){
                        if(user_choice === 8){
                            //ステップ1の項目の8番目が「なりすまし」になっている場合、センシティブの項目が存在しないため「攻撃的な行為や嫌がらせ」に切り替える
                            user_choice = 1;
                            choice_convert_flag = true;
                        }
                    }
                    if(!choice_convert_flag && now_steps === 1 && input_response.subtasks[0].choice_selection?.choices[10]?.id === "CivicIntegrityOption"){
                        if(user_choice === 10){
                            //ユーザーページなどでステップ1の項目が11種類の場合、「暴力行為やヘイト行為の主体」が9番目にあるので切り替える
                            user_choice = 9;
                            choice_convert_flag = true;
                        }
                    }
                }
                if (now_steps == 1) {
                    //新しい報告種別「SimpleOption」に対応させる
                    if(input_response.subtasks[0].choice_selection.choices.some(option => option.id === "SpamSimpleOption")){
                        //新UI報告オプション
                        let report_type = "SpamSimpleOption";
                        const simple_option_map = [
                          "HateOrAbuseSimpleOption",
                          "HateOrAbuseSimpleOption",
                          "TerrorismSimpleOption",
                          null,
                          null,
                          null,
                          "SpamSimpleOption",
                          null,
                          "ViolentMediaSimpleOption",
                          null,
                          "ViolentSpeechSimpleOption",
                          null,
                        ];
                        //指定された報告種別がない場合はスパム報告にフォールバックする
                        //特にユーザーページで ViolentMediaSimpleOption が選択できない事が多い
                        if(input_response.subtasks[0].choice_selection.choices.some(option => option.id === simple_option_map[user_choice])){
                            report_type = simple_option_map[user_choice];
                        }else{
                            systemMessagePanel.setMessage('設定された報告種別を選択できませんでした。スパムとして報告を行います', "info");
                        }
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"single-selection\",\"choice_selection\":{\"link\":\"next_link\",\"selected_choices\":[\"${report_type}\"]}}]}`;
                    }else{
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"single-selection\",\"choice_selection\":{\"link\":\"next_link\",\"selected_choices\":[\"${input_response.subtasks[0].choice_selection.choices[user_choice].id}\"]}}]}`;
                    }
                } else {
                    if (report_finalize != true && user_choice != 6) {
                        //主に旧報告UI向け。新UIでは進捗100%になるため、ここはスルーされる
                        //報告種別が10種類のものもあれば、11種類のものもあるので、センシティブの項目を判別してマップを切り替える
                        //報告種別が「スパム」では第二ステップの選択肢はないのでパスする
                        let choice_def = [];
                        //第2ステップの選択項目
                        if(!choice_convert_flag){
                            choice_def = [4, 5, 2, null, null, null, null, null, 0, null, null, null];
                        }else{
                            choice_def = [4, 0, 2, null, null, null, null, null, null, null];
                        }
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"single-selection\",\"choice_selection\":{\"link\":\"next_link\",\"selected_choices\":[\"${input_response.subtasks[0].choice_selection.choices[choice_def[user_choice]].id}\"]}}]}`;
                    } else {
                        //進捗100%の場合など、一連のフローが終了したということを送信する
                        report_second_stage_body = `{\"flow_token\":\"${input_token_convert}\",\"subtask_inputs\":[{\"subtask_id\":\"${input_response.subtasks[0].subtask_id}\",\"settings_list\":{\"setting_responses\":[],\"link\":\"next_link\"}}]}`;
                    }
                }
                fetch(`https://${access_host}/i/api/1.1/report/flow.json`, {
                    headers: {
                        "authorization": public_bearer_token,
                        "content-type": "application/json",
                        "x-csrf-token": get_csrf_token,
                        "X-Twitter-Active-User": "yes",
                        "X-Twitter-Auth-Type": "OAuth2Session",
                        "X-Twitter-Client-Language": "ja",
                        "X-Client-Transaction-Id": ctid_create()
                    },
                    "referrer": `https://${access_host}/i/safety/report_story_start`,
                    "body": report_second_stage_body,
                    "method": "POST"
                }).then(response => {
                    if (response.status != 200) {
                        switch (response.status) {
                            case 429:
                                systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(レートリミット)`, "error");
                                console.error(response.status);
                                resolve(false);
                                //throw new Error(response.status);
                                break;
                            case 304:
                                systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(レートリミットの可能性)(Res:${response.status})`, "error");
                                console.error(response.status);
                                resolve(false);
                                //throw new Error(response.status);
                                break;
                            default:
                                systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(Res:${response.status})`, "error");
                                console.error(response.status);
                                resolve(false);
                                //throw new Error(response.status);
                                break;
                        }
                        /*if (response.status == 429) {
                            systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(レートリミット)`, "error");
                            console.error(response.status);
                            resolve(false);
                            //throw new Error(response.status);
                        } else {
                            systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(Res:${response.status})`, "error");
                            console.error(response.status);
                            resolve(false);
                            //throw new Error(response.status);
                        }*/
                    } else {
                        systemMessagePanel.setMessage(`通報の${now_steps}ステップ目成功(Res:${response.status})`, "info");
                        return response.json();
                    }
                }).then((resp_json_secondstep) => {
                    now_steps += 1;
                    if (resp_json_secondstep.subtasks[0].progress_indication.percentage_complete != 100) {
                        send_srv(resp_json_secondstep);
                    } else {
                        if (report_finalize == false) {
                            report_finalize = true;
                            send_srv(resp_json_secondstep);
                        } else {
                            systemMessagePanel.setMessage(`通報の最終ステップ成功`, "info");
                            if (fail_report_tweet_status_ids_regex != null && fail_report_tweet_status_ids_regex.test(report_twid) == true) {
                                report_ids_temp(report_twid, "fail_report_delete");
                            }
                            resolve(true);
                        }
                    }
                }).catch(error => {
                    console.log("Report 2nd stage error");
                    //連続報告を行った際に発生するエラーを判定する
                    if(now_steps === 2 && error.message.includes("(reading 'subtasks')")){
                        systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(連続報告により一時的に制限された可能性)`, "error");
                    }else{
                        systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(${error.message})`, "error");
                    }
                    report_ids_temp(report_twid, "fail_report");
                    console.log(error);
                });
            }
        });
    }
    //ct0トークン取得後初期実行
    const first_report = new Promise((resolve) => {
        fetch(`https://${access_host}/i/api/1.1/report/flow.json?flow_name=report-flow`, {
            headers: {
                "authorization": public_bearer_token,
                "content-type": "application/json",
                "x-csrf-token": get_ct0_token,
                "X-Twitter-Active-User": "yes",
                "X-Twitter-Auth-Type": "OAuth2Session",
                "X-Twitter-Client-Language": "ja",
                "X-Client-Transaction-Id": ctid_create()
            },
            "referrer": `https://${access_host}/i/safety/report_story_start`,
            "body": report_first_json_body,
            "method": "POST"
        }).then(response => {
            if (response.status != 200) {
                if (response.status == 429) {
                    systemMessagePanel.setMessage(`通報の初期ステップ失敗(レートリミット)`, "error");
                    throw new Error(response.status);
                } else {
                    systemMessagePanel.setMessage(`通報の初期ステップ失敗(Res:${response.status})`, "error");
                    throw new Error(response.status);
                }
            } else {
                systemMessagePanel.setMessage(`通報の初期ステップ成功(Res:${response.status})`, "info");
                return response.json();
            }
        }).then((resp_json_firststep) => {
            //2ステップ
            send_second_report(resp_json_firststep).then((res) => {
                //console.log(res)
                resolve(res);
            });
        }).catch(error => {
            console.log("Report 1st stage error");
            systemMessagePanel.setMessage(`通報の初期ステップ失敗(${error.message})`, "error");
            report_ids_temp(report_twid, "fail_report");
            resolve(false);
            console.log(error);
        });
    });
    return first_report;
}
//報告関数(コミュニティ)
function report_tweet_community(report_mode, report_element, report_twid, host_mode) {
    let access_host = "x.com";
    if (host_mode == "twitter.com") {
        access_host = "twitter.com";
    }
    const report_mode_conv = Number(report_mode);
    let report_mode_str_first = null;
    let report_mode_str_second = null;
    const tweet_info_obj = JSON.parse(report_element.getAttribute("cslt_tweet_info"));;
    const report_first_param_body = tweet_info_obj.report_param.replaceAll("%cslt_random_uuid%", crypto.randomUUID());
    let old_send_url = `https://${access_host}/i/report/status/${report_twid}`;
    //プロモーションの場合関数終了
    if (tweet_info_obj.is_promoted == true) {
        systemMessagePanel.setMessage(`広告のため報告はスキップされます`, "warning");
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
    async function send_second_report(response_obj) {
        return new Promise((resolve) => {
            const first_step_resp_html = new DOMParser().parseFromString(response_obj, "text/html");
            let now_steps = 1;
            let report_finalize = false;

            send_srv(response_obj);
            function send_srv(input_response) {
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
                fetch(`https://${access_host}/i/safety/report_story${send_url_param}`, {
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
                        if (response.status == 429) {
                            systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(コミュニティ/レートリミット)`, "error");
                            console.error(response.status);
                            resolve(false);
                        } else {
                            systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(コミュニティ/Res:${response.status})`, "error");
                            console.error(response.status);
                            resolve(false);
                        }
                    } else {
                        old_send_url = response.url;
                        systemMessagePanel.setMessage(`通報の${now_steps}ステップ目成功(コミュニティ/Res:${response.status})`, "info");
                        return response.text();
                    }
                }).then((resp_text_firststep) => {
                    //次ステップへ
                    if (now_steps != 2) {
                        now_steps += 1;
                        send_srv(resp_text_firststep);
                    } else {
                        //console.log("community report end!");
                        systemMessagePanel.setMessage(`通報の最終ステップ成功(コミュニティ)`, "info");
                        if (fail_report_tweet_status_ids_regex != null && fail_report_tweet_status_ids_regex.test(report_twid) == true) {
                            report_ids_temp(report_twid, "fail_report_delete");
                        }
                        resolve(true);
                    }
                }).catch(error => {
                    console.log("Community Report 2nd stage error");
                    report_ids_temp(report_twid, "fail_report");
                    systemMessagePanel.setMessage(`通報の${now_steps}ステップ目失敗(コミュニティ/${error.message})`, "error");
                    resolve(false);
                    console.log(error);
                });
            }
        });
    }
    const first_report = new Promise((resolve) => {
        fetch(`https://${access_host}/i/safety/report_story?${report_first_param_body}`, {
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
            //console.log(response.ok)
            if (response.status != 200) {
                if (response.status == 429) {
                    systemMessagePanel.setMessage(`通報の初期ステップ失敗(コミュニティ/レートリミット)`, "error");
                    throw new Error(response.status);
                } else {
                    systemMessagePanel.setMessage(`通報の初期ステップ失敗(コミュニティ/Res:${response.status})`, "error");
                    throw new Error(response.status);
                }
            } else {
                old_send_url = response.url;
                systemMessagePanel.setMessage(`通報の初期ステップ成功(コミュニティ/Res:${response.status})`, "info");
                return response.text();
            }
        }).then((resp_text_firststep) => {
            //2ステップ
            send_second_report(resp_text_firststep).then((res) => {
                //console.log(res)
                resolve(res);
            });
        }).catch(error => {
            console.log("Community Report 1st stage error");
            systemMessagePanel.setMessage(`通報の初期ステップ失敗(コミュニティ/${error.message})`, "error");
            report_ids_temp(report_twid, "fail_report");
            resolve(false);
            console.log(error);
        });
    });
    return first_report;
}
//ブロック関数(API直接)
async function block_user(user_id, screen_name, host_mode) {
    let access_host = "x.com";
    if (host_mode == "twitter.com") {
        access_host = "twitter.com";
    }
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const run_block = await new Promise((resolve) => {
        ct0_token_get(location.host).then(function (ct0_token) {
            let csrf_token = ct0_token;
            fetch(`https://${access_host}/i/api/1.1/blocks/create.json`, {
                method: "POST",
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
            }).then((resp) => {
                if (resp.status != 200) {
                    if (resp.status == 429) {
                        systemMessagePanel.setMessage("ブロックできません(レートリミット)", "error");
                    }
                    throw new Error(resp.status);
                } else {
                    systemMessagePanel.setMessage("ブロックしました", "info");
                    if (fail_block_mute_user_ids_regex != null && fail_block_mute_user_ids_regex.test(user_id) == true) {
                        report_ids_temp(user_id, "fail_block_mute_delete");
                        //console.log(fail_block_mute_user_ids)
                    }
                    return resp.json();
                }
            }).then((json) => {
                //console.log(json);
                resolve(true);
            }).catch(error => {
                console.log("fail block");
                console.log(error);
                report_ids_temp(user_id, "fail_block_mute");
                systemMessagePanel.setMessage(`ブロックできません(${error.message})`, "error");
                resolve(false);
            });
        });
    });
    //CSLT側のリストへ追加
    if (screen_name != null || screen_name != undefined) {
        await add_cslt_hide_user_list(screen_name);
    }
    return run_block;
}
//ミュート関数(API直接)
async function mute_user(user_id, screen_name, host_mode) {
    let access_host = "x.com";
    if (host_mode == "twitter.com") {
        access_host = "twitter.com";
    }
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const run_mute = await new Promise((resolve) => {
        ct0_token_get(location.host).then(function (ct0_token) {
            let csrf_token = ct0_token;
            fetch(`https://${access_host}/i/api/1.1/mutes/users/create.json`, {
                method: "POST",
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
            }).then((resp) => {
                if (resp.status != 200) {
                    if (resp.status == 429) {
                        systemMessagePanel.setMessage("ミュートできません(レートリミット)", "error");
                    }
                    throw new Error(resp.status);
                } else {
                    systemMessagePanel.setMessage("ミュートしました", "info");
                    if (fail_block_mute_user_ids_regex != null && fail_block_mute_user_ids_regex.test(user_id) == true) {
                        report_ids_temp(user_id, "fail_block_mute_delete");
                    }
                    return resp.json();
                }
            }).then((json) => {
                //console.log(json);
                resolve(true);
            }).catch(error => {
                console.log("fail mute");
                console.log(error);
                report_ids_temp(user_id, "fail_block_mute");
                systemMessagePanel.setMessage(`ミュートできません(${error.message})`, "error");
                resolve(false);
            });
        });
    });
    //CSLT側のリストへ追加
    if (screen_name != null || screen_name != undefined) {
        await add_cslt_hide_user_list(screen_name);
    }
    return run_mute;
}
//CSLT側の非表示ユーザー追加関数
async function add_cslt_hide_user_list(input_screen_name) {
    const get_cslt_setting = await new Promise((resolve) => {
        chrome.storage.local.get("cslp_settings", function (value) {
            resolve(value);
        });
    })
    const cslt_settings_parse = JSON.parse(get_cslt_setting.cslp_settings);
    if (!cslt_settings_parse.user_register_hideuser.includes(input_screen_name)) {
        cslt_settings_parse.user_register_hideuser.push(input_screen_name);
        const write_cslt_settings = await new Promise((resolve) => {
            chrome.storage.local.set({ 'cslp_settings': JSON.stringify(cslt_settings_parse) }, function () {
                resolve(true);
            });
        });
        if (write_cslt_settings) {
            return true;
        } else {
            return false;
        }
    }
}
//ブロック・ミュートリスト取得関数
async function get_block_mute_list(mode, host_mode, cursor_id) {
    //APIへの1アクセスあたり38件分のユーザーリスト取得上限?
    let access_host = "x.com";
    if (host_mode == "twitter.com") {
        access_host = "twitter.com";
    }
    const public_bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    let graphql_url = null;
    let graphql_param = null;
    let graphql_features = null;
    if (mode == "block") {
        //ブロックリスト
        graphql_param = { count: 37, includePromotedContent: false, withSafetyModeUserFields: false };
        graphql_features = `{"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"articles_preview_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_enhance_cards_enabled":false}`;
        graphql_url = `https://${access_host}/i/api/graphql/ugCclQ08T0qMYjS3SYvMdQ/BlockedAccountsAll`;
    } else {
        //ミュートリスト
        graphql_param = { count: 37, includePromotedContent: false };
        graphql_features = `{"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"articles_preview_enabled":true,"tweetypie_unmention_optimization_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_enhance_cards_enabled":false}`;
        graphql_url = `https://${access_host}/i/api/graphql/J0tjDZrm9M6UYRoPtXcvhg/MutedAccounts`;
    }
    const run_get_list = await new Promise((resolve) => {
        let user_lists_concat = [];
        async function get_user_lists(cursor_str) {
            try {
                const ct0_token = await ct0_token_get(location.host);
                if (cursor_str != null) {
                    graphql_param["cursor"] = cursor_str;
                }

                const lists_api_access = await fetch(`${graphql_url}?variables=${encodeURIComponent(JSON.stringify(graphql_param).replaceAll(/\s/g, ""))}&features=${encodeURIComponent(graphql_features)}`, {
                    method: "GET",
                    headers: {
                        "authorization": public_bearer_token,
                        "X-Csrf-Token": ct0_token,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        "X-Twitter-Active-User": "yes",
                        "X-Twitter-Auth-Type": "OAuth2Session",
                        "X-Twitter-Client-Language": "ja",
                        "X-Client-Transaction-Id": ctid_create()
                    }
                });

                if (lists_api_access.status != 200) {
                    if (lists_api_access.status == 429) {
                        systemMessagePanel.setMessage("リストが取得できません(レートリミット)", "error");
                        if (cursor_str == null) {
                            //console.log(lists_api_access)
                            const limit_date = new Date(lists_api_access.headers.get("x-rate-limit-reset") * 1000);
                            await navigator.clipboard.writeText(cursor_str);
                            alert(`リミットエラーにより取得を停止しました。\r\n再開用IDをクリップボードにコピーしました。\r\n※再開用IDは次回取得再開時に必要です\r\nID->${cursor_str}\r\n${limit_date.getHours()}時${limit_date.getMinutes()}分${limit_date.getSeconds()}秒を経過した頃にIDを指定し再度実行してください`);
                            resolve(user_lists_concat);
                        }
                    }
                    throw new Error(lists_api_access.status);
                }

                const api_json = await lists_api_access.json();
                let user_lists = null;
                if (mode == "block") {
                    user_lists = await (api_json?.data?.viewer?.timeline?.timeline?.instructions?.find(i => i?.entries))?.entries;
                }else{
                    user_lists = await (api_json?.data?.viewer?.muting_timeline?.timeline?.instructions?.find(i => i?.entries))?.entries;
                }
                console.log(user_lists)
                const user_list_cursor = user_lists[user_lists.length - 2].content.value;
                if (user_list_cursor.match(/^0\|/g) == null) {
                    //console.log("continue")
                    user_lists_concat = user_lists_concat.concat(user_lists.slice(0, user_lists.length - 2));
                    //console.log(user_lists_concat)
                    await get_user_lists(user_list_cursor);
                } else {
                    user_lists_concat = user_lists_concat.concat(user_lists.slice(0, user_lists.length - 2));
                    resolve(user_lists_concat);
                }
            } catch (error) {
                systemMessagePanel.setMessage(`リストが取得できません(${error.message})`, "error");
                console.error(error)
                if (user_lists_concat.length == 0) {
                    resolve(null);
                } else {
                    alert("エラーにより途中までのデータを使用します")
                    resolve(user_lists_concat);
                }

            }
        }
        get_user_lists(cursor_id);
    });
    return run_get_list;
}
//開発者提供用関数
function developer_spam_user_share(report_srv, spam_element) {
    const report_json_del_privacy = JSON.parse(spam_element.getAttribute('cslt_tweet_info'));
    //提供者情報を含むデータを削除
    delete report_json_del_privacy.report_json;
    //console.log(report_json_del_privacy)
    let tweet_user_id = null;
    let tweet_uesr_name = null;
    let tweet_text = null;
    let tweet_text_length = null;
    tweet_user_id = spam_element.querySelector('[data-testid="User-Name"]  a').href.replace(/(https:\/\/x.com\/|https:\/\/twitter.com\/)/g, "");
    tweet_uesr_name = spam_element.querySelector('article [data-testid="User-Name"] a').textContent;
    tweet_text = `${spam_element.querySelector('article[data-testid="tweet"] [aria-labelledby]')?.innerText}%and%${spam_element.querySelector('[aria-labelledby] div[data-testid="tweetText"]')?.innerText}`;
    tweet_text_length = tweet_text.length;
    //console.log({tweet_user_id:tweet_user_id, tweet_user_name:tweet_uesr_name, tweet_text:tweet_text, tweet_length:tweet_text_length})
    chrome.runtime.sendMessage({ message: { mode: "developer_report_share", target: { report_srv_url: report_srv, tweet_user_id: tweet_user_id, tweet_user_name: tweet_uesr_name, tweet_text: tweet_text, tweet_length: tweet_text_length, report_json_data: report_json_del_privacy } } }, (response) => { });
}
//ユーザーメッセージ表示領域初期化関数
function cslt_message_display_init() {
    //カラーを定義
    const colors = {
        info:    "#1d9bf0",
        warning: "#f0721d",
        error:   "#f01d47",
    };
    //メッセージラッパーを設定
    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
        display: "none",
        position: "fixed",
        bottom: "4rem",
        width: "100vw",
        height: "2rem",
        zIndex: "9999",
        alignItems: "center",
        justifyContent: "center",
    });
    //メッセージ本体を設定
    const content = document.createElement("div");
    Object.assign(content.style, {
        display: "flex",
        height: "100%",
        padding: "0 10px",
        color: "white",
        borderRadius: "5px",
        textAlign: "center",
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
    });

    const text = document.createElement("span");
    content.append(text);
    wrap.append(content);
    document.body.prepend(wrap);

    let timer = null;

    return {
        //メッセージ設定の関数を返す
        setMessage(message, mode = "info", autoCloseMs = 5000){
            if (!document.contains(wrap)) document.body.prepend(wrap);

            text.textContent = message;
            content.style.backgroundColor = colors[mode] || colors.info;
            wrap.style.display = "flex";
            if (timer) clearTimeout(timer);
            if (autoCloseMs > 0) {
                timer = setTimeout(() => { wrap.style.display = "none"; }, autoCloseMs);
            }
        },
    };
}

async function tweet_area_clear(target_element, mode) {
    new Promise(() => {
        const target_tweet_info = JSON.parse(target_element.getAttribute("cslt_tweet_info"));
        const target_tweet_id = target_tweet_info.tweet_id;
        const target_tweet_user_id = target_tweet_info.user_data.user_id;
        switch (mode) {
            case "report_only":
                target_element.setAttribute("cslt_temp_hide_flag", "complete");
                target_element.textContent = "";
                break;
            case "mute_block":
                const target_other_tweet_all = document.querySelectorAll('div[data-testid="cellInnerDiv"][cslt_tweet_info]:not([cslt_temp_hide_flag="complete"],[cslt_hide_flag="true"])');
                for (let index = 0; index < target_other_tweet_all.length; index++) {
                    const all_target_tweet_info = JSON.parse(target_other_tweet_all[index].getAttribute("cslt_tweet_info"));
                    //console.log(all_target_tweet_info)
                    if (all_target_tweet_info.user_data.user_id == target_tweet_user_id) {
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
function ctid_create() {
    return btoa(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(70)))).replaceAll("=", "");
}
async function ct0_token_get(host_mode) {
    return await new Promise(async (resolve, reject) => {
        const is_private_mode = chrome.extension.inIncognitoContext;
        //console.log(is_use_cookie_mode())
        if (is_private_mode || is_use_cookie_mode()) {
            const doc_cookie_ct0 = document.cookie.match(/(?:^|;\s*)ct0=([^;]*)/)?.[1];
            resolve(doc_cookie_ct0 || false);
        } else {
            const get_broswer_api_ct0 = await new Promise((api_resolve) => {
                chrome.runtime.sendMessage({ message: { mode: "ct0_token_get", target: { target_host_mode: host_mode } } }, (response) => {
                    api_resolve(response);
                });
            })
            if (get_broswer_api_ct0 != undefined) {
                //console.log("BrowserAPIMode")
                resolve(get_broswer_api_ct0);
            } else {
                //console.log("DocumentMode")
                const doc_cookie_ct0 = document.cookie.match(/(?:^|;\s*)ct0=([^;]*)/)?.[1];
                resolve(doc_cookie_ct0 || false);
            }
        }
    })
}
//スクリーンネーム取得関数(status)
function get_tweet_status_root_user() {
    if (window.location.pathname.split("/")[2] == 'status') {
        //const root_user_scrname = document.querySelector('article[data-testid="tweet"][tabindex="-1"] div[data-testid="User-Name"] a[role="link"][tabindex="-1"] span')?.textContent;
        const root_user_scrname = window.location.pathname.split("/")[1];
        if (root_user_scrname != null) {
            return root_user_scrname.replace("@", "");
        }
    } else {
        return null;
    }
}
//ブロック・ミュートインポート/エクスポート機能関数
function block_mute_io() {
    if (document.getElementsByClassName('cslt_block_mute_io_btn_wrap').length == 0 && document.querySelector('a[target="_blank"][role="link"]')?.closest('div:not([dir="ltr"])') != null) {
        document.querySelector('a[target="_blank"][role="link"]').closest('div:not([dir="ltr"])').insertAdjacentHTML('afterbegin', `<div class="cslt_block_mute_io_btn_wrap"><div class="cslt_block_mute_list_func_btn" id="cslt_block_mute_userlist_import_btn"><span>リストインポート</span><span>(CSLT/試験実装)</span><input type="file" accept="application/json" class="cslt_userlist_data_input" id="cslt_block_mute_userlist_input_data"/></div><div class="cslt_block_mute_list_func_btn" id="cslt_block_mute_userlist_export_btn"><span>リストエクスポート</span><span>(CSLT/試験実装)</span></div></div>`);
        document.querySelector("#cslt_block_mute_userlist_export_btn").addEventListener("click", async function () {
            function download_list(user_list, mode) {
                const now_date = new Date();
                const blob_url = URL.createObjectURL(new Blob([JSON.stringify(user_list)], { type: "application/json" }));
                const dl_tag = document.createElement("a");
                dl_tag.target = "_blank";
                dl_tag.href = blob_url;
                dl_tag.download = `CSLT_${mode}_UserList_${now_date.toLocaleDateString('sv-SE').replaceAll("-", "/")} ${now_date.toLocaleTimeString('ja-JP', { hour12: false })}.json`;
                dl_tag.click();
                URL.revokeObjectURL(blob_url);
                dl_tag.remove();
            }
            const export_user_list = [];
            if (window.location.pathname.split("/")[2] == 'blocked') {
                let user_list = null;
                if (confirm("再開用IDがありますか？\r\n持っている場合は「OK」、持っていない場合は「キャンセル」で続行してください")) {
                    let cursor_id = prompt("再開用IDを入力してください\r\nIDを入力し「OK」を押してください\r\n「キャンセル」で通常モードとして続行します");
                    //console.log(cursor_id)
                    if (cursor_id == "") {
                        cursor_id = null;
                    }
                    user_list = await get_block_mute_list("block", location.host, cursor_id);
                } else {
                    user_list = await get_block_mute_list("block", location.host, null);
                }
                systemMessagePanel.setMessage("ユーザーリストの取得中", "info");
                user_list.forEach((user_data) => {
                    if (user_data.content.itemContent?.user_results != undefined) {
                        //console.log(user_data.content.itemContent.user_results.result.legacy.name)
                        export_user_list.push(user_data.content.itemContent.user_results.result)
                    }
                });
                download_list(export_user_list, "Block")
            } else {
                let user_list = null;
                if (confirm("再開用IDがありますか？\r\n持っている場合は「OK」、持っていない場合は「キャンセル」で続行してください")) {
                    let cursor_id = prompt("再開用IDを入力してください\r\nIDを入力し「OK」を押してください\r\n「キャンセル」で通常モードとして続行します");
                    //console.log(cursor_id)
                    if (cursor_id == "") {
                        cursor_id = null;
                    }
                    user_list = await get_block_mute_list("mute", location.host, cursor_id);
                } else {
                    user_list = await get_block_mute_list("mute", location.host, null);
                }
                systemMessagePanel.setMessage("ユーザーリストの取得中", "info");
                user_list.forEach((user_data) => {
                    if (user_data.content.itemContent?.user_results != undefined) {
                        export_user_list.push(user_data.content.itemContent.user_results.result);
                    }
                });
                systemMessagePanel.setMessage("ユーザーリストのダウンロードを行います", "info");
                download_list(export_user_list, "Mute");
            }
        })
        document.querySelector("#cslt_block_mute_userlist_import_btn").addEventListener("click", function () {
            document.querySelector("#cslt_block_mute_userlist_input_data").click();
        })
        document.querySelector("#cslt_block_mute_userlist_input_data").addEventListener("change", function () {
            //this.files[0])
            if (confirm(`「${this.files[0].name}」を読み込みますか？`)) {
                const file_reader = new FileReader();
                file_reader.readAsText(this.files[0]);
                file_reader.onload = async function () {
                    let resume_num = 0;
                    if (confirm("インポート再開用番号を持っていますか？\r\n持っている場合は「OK」、持っていない場合は「キャンセル」で続行してください")) {
                        const import_num = prompt("再開用番号を入力してください\r\n番号を入力し「OK」を押してください\r\n「キャンセル」で通常モードとして続行します");
                        if (import_num != "" || import_num != null) {
                            resume_num = Number(import_num);
                            if (resume_num == NaN) {
                                resume_num = 0;
                            }
                        }
                    }
                    const input_user_list = JSON.parse(file_reader.result).slice(resume_num);
                    const input_user_list_all_length = JSON.parse(file_reader.result).length;
                    if (confirm(`${input_user_list.length}件のユーザーを現在のリストに追加しますか？`)) {
                        if (window.location.pathname.split("/")[2] == 'blocked') {
                            let now_status_num = 1;
                            systemMessagePanel.setMessage("処理を開始します", "info");
                            for (const user_data of input_user_list) {
                                systemMessagePanel.setMessage(`${now_status_num}/${input_user_list.length}処理中-${user_data.legacy.name}`, "info");
                                //console.log(user_data.rest_id)
                                //console.log(user_data.legacy.name)
                                const block_run = await new Promise((resolve) => {
                                    block_user(user_data.rest_id, null, location.host).then((status) => {
                                        now_status_num += 1;
                                        resolve(status);
                                    });
                                });
                                if (!block_run) {
                                    let new_resume_num = 0;
                                    if (resume_num != 0) {
                                        new_resume_num = resume_num + now_status_num - 2;
                                    } else {
                                        new_resume_num = now_status_num - 2;
                                    }
                                    await navigator.clipboard.writeText(new_resume_num);
                                    alert(`インポート中にエラーが発生しました\r\n30分~1時間後、再開用番号を入力して再度実行してください\r\n再開用番号をクリップボードにコピーしました\r\n再開用番号:${new_resume_num}`);
                                    break;
                                }
                                if (now_status_num > input_user_list.length) {
                                    systemMessagePanel.setMessage("処理が完了しました", "info");
                                }
                            }
                        } else {
                            let now_status_num = 1;
                            systemMessagePanel.setMessage("処理を開始します", "info");
                            for (const user_data of input_user_list) {
                                systemMessagePanel.setMessage(`${now_status_num}/${input_user_list.length}処理中-${user_data.legacy.name}`, "info");
                                //console.log(user_data.rest_id)
                                //console.log(user_data.legacy.name)
                                const mute_run = await new Promise((resolve) => {
                                    mute_user(user_data.rest_id, null, location.host).then((status) => {
                                        now_status_num += 1;
                                        resolve(status);
                                    });
                                });
                                if (!mute_run) {
                                    let new_resume_num = 0;
                                    if (resume_num != 0) {
                                        new_resume_num = resume_num + now_status_num - 2;
                                    } else {
                                        new_resume_num = now_status_num - 2;
                                    }
                                    await navigator.clipboard.writeText(new_resume_num);
                                    alert(`インポート中にエラーが発生しました\r\n30分~1時間後、再開用番号を入力して再度実行してください\r\n再開用番号をクリップボードにコピーしました\r\n再開用番号:${new_resume_num}`);
                                    break;
                                }
                                if (now_status_num > input_user_list.length) {
                                    systemMessagePanel.setMessage("処理が完了しました！リストを開き直してください", "info");
                                }
                            }
                        }
                    }
                }
                file_reader.onerror = function () {
                    systemMessagePanel.setMessage("ファイルの読み込みに失敗しました", "error");
                }
            }
            this.value = '';
        })
    }
}
//配列内文字列エスケープ処理&正規表現作成関数
function array_regexp_escape(input_array, is_group){
    if(is_group){
        return new RegExp(`(${input_array.join("<-NO_RP->").replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/<-NO_RP->/g, "|")})`, 'g');
    }else{
        return new RegExp(`(${input_array.join("<-NO_RP->").replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/<-NO_RP->/g, "|")})`);
    }
}
//任意月以内検出関数
function is_date_with_month(date, range){
    const input_date = new Date(date);
    const now_date = Date.now();
    const range_date = new Date();
    range_date.setMonth(range_date.getMonth() - range);
    const range_start_date = range_date.getTime();
    return input_date >= range_date && range_start_date <= now_date;
}