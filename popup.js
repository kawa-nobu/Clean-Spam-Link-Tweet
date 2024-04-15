window.addEventListener("load", function(){
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
            console.log("Open Twitter");
            if(cslp_update_flag == true){
                append_alert("<p>Clean-Spam-Link-Tweetバージョンが更新されたため、設定の初期化を行いました。<br>Twitterを開くか再読み込みをしてください。</p>", "window_close");
            }else{
                append_alert("<p>設定を構築する為、Twitterを開くか再読み込みをしてください。</p>", "window_close");
            }
        }else{
            console.log("settings found!");
            cslp_settings = JSON.parse(cslp_settings.cslp_settings);
            console.log(cslp_settings);
            document.getElementById("filter_sw").checked = cslp_settings.filter;
            document.getElementById("hit_tweet_sw").checked = cslp_settings.hit_del;
            document.getElementById("disable_url_sw").checked = cslp_settings.disable_hit;
            document.getElementById("amz_aff_sw").checked = cslp_settings.amazon_hit;
            document.getElementById("filter_latest_sw").checked = cslp_settings.filter_latest;
            document.getElementById("filter_ver").innerText = cslp_settings.filter_update;
            document.getElementById("imp_filter_ver").innerText = cslp_settings.imp_filter_update;
            document.getElementById("extt_ver").innerText = cslp_settings.version;
            document.getElementById("hiturl_copy_sw").checked = cslp_settings.hit_url_copy;
            document.getElementById("hiturl_copy_opt").value = cslp_settings.hit_url_copy_mode;
            document.getElementById("hitur_copy_text").value = cslp_settings.hit_url_copy_user_text;
            document.getElementById("disable_shorturl_sw").checked = cslp_settings.short_url_hit_disable;

            document.getElementById("hiturl_copy_adv_sw").checked = cslp_settings.hit_url_copy_advanced;
            document.getElementById("hiturl_copy_adv_filter_sw").checked = cslp_settings.hit_url_copy_advanced_filter;
            document.getElementById("stealth_blue_sw").checked = cslp_settings.stealth_blue_view;
            document.getElementById("blue_block_sw").checked = cslp_settings.blue_block;
            document.getElementById("root_blue_block_sw").checked = cslp_settings.root_tweetuser_block;
            document.getElementById("blue_block_val_num").value = cslp_settings.blue_block_value_num;
            document.getElementById("blue_block_opt").value = cslp_settings.blue_block_mode;
            document.getElementById("imp_blocker_sw").checked = cslp_settings.imp_user_block;
            document.getElementById("imp_blocker_all_sw").checked = cslp_settings.imp_filter_block_all_area;
            document.getElementById("follow_list_find_impuser_sw").checked = cslp_settings.follow_list_imp_find_user;

            document.getElementById("arabic_block_sw").checked = cslp_settings.arabic_reply_block;
            document.getElementById("arabic_user_block_sw").checked = cslp_settings.arabic_user_reply_block;

            document.getElementById("click_report_sw").checked = cslp_settings.oneclick_report;
            document.getElementById("click_report_follow_list_sw").checked = cslp_settings.oneclick_report_follow_list;
            document.getElementById("click_report_btn_tl_disable_sw").checked = cslp_settings.oneclick_report_timeline_disable;

            document.getElementById("click_report_btn_confirm_sw").checked = cslp_settings.oneclick_report_confirm;

            document.getElementById("click_mute_block_opt").value = cslp_settings.oneclick_report_after_mode;
            document.getElementById("click_report_opt").value = cslp_settings.oneclick_report_option;
            document.getElementById("click_developer_report_sw").checked = cslp_settings.oneclick_developer_report;

            document.getElementById("developer_report_srv").value = cslp_settings.oneclick_developer_reportsrv_url;


            document.getElementById("filter_list").innerHTML = `<a href="${cslp_settings.filter_link}" target="_blank" rel="noopener noreferrer">フィルタリスト</a>`;
            document.getElementById("filter_thanks").innerText = cslp_settings.filter_thanks+" 様";
            //報告選択できる項目
            if(cslp_settings.oneclick_report != true){
                document.querySelector('#click_mute_block_opt option[value="1"]').disabled = true;
                document.querySelector('#click_mute_block_opt option[value="2"]').disabled = true;
                document.querySelector('#click_mute_block_opt option[value="3"]').disabled = false;
                document.querySelector('#click_mute_block_opt option[value="4"]').disabled = false;
                document.querySelector("#click_report_opt").disabled = true;
            }else{
                document.querySelector('#click_mute_block_opt option[value="1"]').disabled = false;
                document.querySelector('#click_mute_block_opt option[value="2"]').disabled = false;
                document.querySelector('#click_mute_block_opt option[value="3"]').disabled = true;
                document.querySelector('#click_mute_block_opt option[value="4"]').disabled = true;
                document.querySelector("#click_report_opt").disabled = false;
            }
            
            if(cslp_settings.oneclick_developer_report != true){
                document.querySelector('#click_mute_block_opt option[value="5"]').disabled = true;
            }else{
                document.querySelector('#click_mute_block_opt option[value="5"]').disabled = false;
            }
        }
        if(window.navigator.userAgent.toLowerCase().indexOf("firefox") != -1 ){
            document.getElementById("extt_ver").innerText = `${cslp_settings.version}(FireFox)`;
        }else{
            if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1 && window.navigator.userAgent.toLowerCase().indexOf("chrome") != -1){
                document.getElementById("extt_ver").innerText = `${cslp_settings.version}(ChromiumベースAndroid OS版)`;
            }
            if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1 && window.navigator.userAgent.toLowerCase().indexOf("firefox") != -1){
                document.getElementById("extt_ver").innerText = `${cslp_settings.version}(FireFox Android ベータ版)`;
            }
        }
    })
    document.getElementById("filter_sw").addEventListener("change", function(){
        cslp_settings.filter = document.getElementById("filter_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("hit_tweet_sw").addEventListener("change", function(){
        let now_checked = document.getElementById("hit_tweet_sw").checked;
        cslp_settings.hit_del = document.getElementById("hit_tweet_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        if(now_checked != false){
            append_alert("<p>この機能はTwitterの動作が遅くなる可能性があります。</p><p>設定を適用するにはTwitterを再読み込みを行ってください。</p>");
        }else{
            append_alert("<p>設定を適用するにはTwitterを再読み込みを行ってください。</p>");
        }
        
    })
    //
    document.getElementById("disable_shorturl_sw").addEventListener("change", function(){
        cslp_settings.short_url_hit_disable = document.getElementById("disable_shorturl_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>悪用が確認されている短縮URLを阻止の対象外とします。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("imp_blocker_sw").addEventListener("change", function(){
        cslp_settings.imp_user_block = document.getElementById("imp_blocker_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("disable_url_sw").addEventListener("change", function(){
        cslp_settings.disable_hit = document.getElementById("disable_url_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("amz_aff_sw").addEventListener("change", function(){
        cslp_settings.amazon_hit = document.getElementById("amz_aff_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("filter_latest_sw").addEventListener("change", function(){
        cslp_settings.filter_latest = document.getElementById("filter_latest_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>無効にした場合、最新でない可能性のある内蔵フィルタを使用します。<br>有効にした場合、常に最新のフィルタリストを使用します。<br>変更を適用するには、Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("hiturl_copy_sw").addEventListener("change", function(){
        cslp_settings.hit_url_copy = document.getElementById("hiturl_copy_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p><p>URLをコピーするには[Ctrl]キーを、ツイート情報は[L]キー押してブラックアウトされたツイートをクリックしてください。</p>");
    })
    document.getElementById("hiturl_copy_opt").addEventListener("change", function(){
        cslp_settings.hit_url_copy_mode = document.getElementById("hiturl_copy_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("hitur_copy_text").addEventListener("change", function(){
        cslp_settings.hit_url_copy_user_text = document.getElementById("hitur_copy_text").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        let preview_text = document.getElementById("hitur_copy_text").value.replaceAll("%t_co%", "t.coアドレス").replaceAll("%bl_url%", "ブロックURL").replaceAll("%adv_addr%", "解析URL").replaceAll("%tw_id%", "ツイートID").replaceAll("%tw_date%", "ツイート日時");
        append_alert(`<p>出力プレビュー<br><span class="text_bold">${preview_text}</span><br><br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>`);
    })
    //
    document.getElementById("hiturl_copy_adv_sw").addEventListener("change", function(){
        cslp_settings.hit_url_copy_advanced = document.getElementById("hiturl_copy_adv_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("hiturl_copy_adv_filter_sw").addEventListener("change", function(){
        cslp_settings.hit_url_copy_advanced_filter = document.getElementById("hiturl_copy_adv_filter_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("stealth_blue_sw").addEventListener("change", function(){
        cslp_settings.stealth_blue_view = document.getElementById("stealth_blue_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("imp_blocker_all_sw").addEventListener("change", function(){
        cslp_settings.imp_filter_block_all_area = document.getElementById("imp_blocker_all_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>お使いの端末スペックによっては動作が遅くなる可能性がります。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("follow_list_find_impuser_sw").addEventListener("change", function(){
        cslp_settings.follow_list_imp_find_user = document.getElementById("follow_list_find_impuser_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>「インプレ稼ぎアカウント非表示」が有効になっている事を確認してください。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("blue_block_sw").addEventListener("change", function(){
        cslp_settings.blue_block = document.getElementById("blue_block_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("root_blue_block_sw").addEventListener("change", function(){
        cslp_settings.root_tweetuser_block = document.getElementById("root_blue_block_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("blue_block_val_num").addEventListener("change", function(){
        cslp_settings.blue_block_value_num = document.getElementById("blue_block_val_num").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("blue_block_opt").addEventListener("change", function(){
        cslp_settings.blue_block_mode = document.getElementById("blue_block_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        if(document.getElementById("blue_block_opt").value == "1"){
            append_alert("<p>このモードはリプしているユーザーを全て解析する為、<br>環境によっては動作が不安定になる可能性があります。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
        }else{
            append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
        }
    })

    document.getElementById("arabic_block_sw").addEventListener("change", function(){
        cslp_settings.arabic_reply_block = document.getElementById("arabic_block_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    //
    document.getElementById("arabic_user_block_sw").addEventListener("change", function(){
        cslp_settings.arabic_user_reply_block = document.getElementById("arabic_user_block_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>この設定は「アラビア文字リプ非表示」がオンになっている場合のみ動作します。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
//
    document.getElementById("click_report_btn_tl_disable_sw").addEventListener("change", function(){
        cslp_settings.oneclick_report_timeline_disable = document.getElementById("click_report_btn_tl_disable_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })

    document.getElementById("click_report_btn_confirm_sw").addEventListener("change", function(){
        cslp_settings.oneclick_report_confirm = document.getElementById("click_report_btn_confirm_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })

    document.getElementById("click_report_sw").addEventListener("change", function(){
        cslp_settings.oneclick_report = document.getElementById("click_report_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>このモードではワンクリックで報告ができます。<br>スパム報告用途以外での使用は避けてください。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
        if(cslp_settings.oneclick_report != true){
            document.querySelector('#click_mute_block_opt option[value="1"]').disabled = true;
            document.querySelector('#click_mute_block_opt option[value="2"]').disabled = true;
            document.querySelector('#click_mute_block_opt option[value="3"]').disabled = false;
            document.querySelector('#click_mute_block_opt option[value="4"]').disabled = false;
            document.querySelector("#click_report_opt").disabled = true;
        }else{
            document.querySelector('#click_mute_block_opt option[value="1"]').disabled = false;
            document.querySelector('#click_mute_block_opt option[value="2"]').disabled = false;
            document.querySelector('#click_mute_block_opt option[value="3"]').disabled = true;
            document.querySelector('#click_mute_block_opt option[value="4"]').disabled = true;
            document.querySelector("#click_report_opt").disabled = false;
        }
    })

    document.getElementById("click_report_follow_list_sw").addEventListener("change", function(){
        cslp_settings.oneclick_report_follow_list = document.getElementById("click_report_follow_list_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })

    document.getElementById("click_mute_block_opt").addEventListener("change", function(){
        cslp_settings.oneclick_report_after_mode = document.getElementById("click_mute_block_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("click_report_opt").addEventListener("change", function(){
        cslp_settings.oneclick_report_option = document.getElementById("click_report_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("click_developer_report_sw").addEventListener("change", function(){
        cslp_settings.oneclick_developer_report = document.getElementById("click_developer_report_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>情報提供へのご協力、感謝いたします。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
        if(cslp_settings.oneclick_developer_report != true){
            document.querySelector('#click_mute_block_opt option[value="5"]').disabled = true;
        }else{
            document.querySelector('#click_mute_block_opt option[value="5"]').disabled = false;
        }
    })
    document.getElementById("developer_report_srv").addEventListener("change", function(){
        cslp_settings.oneclick_developer_reportsrv_url = document.getElementById("developer_report_srv").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>ご協力頂きありがとうございます。<br>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
//
    document.getElementById("settings_reset_sw").addEventListener("click", function(){
        chrome.storage.local.remove("cslp_settings", function(value){
            append_alert("<p>設定を初期化しました。<br>Twitterを再読み込みしてください。</p>");
        });
    })
    //alertの代替
    function append_alert(message, trig){
        document.body.insertAdjacentHTML('afterbegin', `<div class="append_alert"><div class="append_alert_message"><div>${message}</div><div><button id="append_alert_okbtn">OK</button></div></div></div>`);
        document.getElementById("append_alert_okbtn").addEventListener("click", function(){
            document.getElementsByClassName("append_alert")[0].remove()
            if(trig == "window_close"){
                if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1 ){
                    console("Android!");
                }else{
                    window.close();
                }
            }
        })
    }
})