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
            document.getElementById("amz_aff_sw").checked = cslp_settings.amazon_hit;
            document.getElementById("filter_ver").innerText = cslp_settings.filter_update;
            document.getElementById("extt_ver").innerText = cslp_settings.version;
            document.getElementById("hiturl_copy_sw").checked = cslp_settings.hit_url_copy;
            document.getElementById("hiturl_copy_opt").value = cslp_settings.hit_url_copy_mode;
            document.getElementById("filter_list").innerHTML = `<a href="${cslp_settings.filter_link}" target="_blank" rel="noopener noreferrer">フィルタリスト</a>`;
            document.getElementById("filter_thanks").innerText = cslp_settings.filter_thanks+" 様";
        }
        if(window.navigator.userAgent.toLowerCase().indexOf("firefox") != -1 ){
            document.getElementById("hiturl_menu").style.visibility = "hidden";
            document.getElementById("hiturl_menu").style.height = 0;
            //現在はAndroid版ベータ版
            document.getElementById("extt_ver").innerText = `${cslp_settings.version}(FireFox)`;
        }else{
            if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1 ){
                document.getElementById("dev_menu").style.visibility = "hidden";
                document.getElementById("dev_menu").style.height = 0;
                //現在はAndroid版ベータ版
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
    document.getElementById("amz_aff_sw").addEventListener("change", function(){
        cslp_settings.amazon_hit = document.getElementById("amz_aff_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
    document.getElementById("hiturl_copy_sw").addEventListener("change", function(){
        cslp_settings.hit_url_copy = document.getElementById("hiturl_copy_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p><p>URLをコピーするには、[Alt]キーを押してブラックアウトされたツイートをクリックしてください。</p>");
    })
    document.getElementById("hiturl_copy_opt").addEventListener("change", function(){
        cslp_settings.hit_url_copy_mode = document.getElementById("hiturl_copy_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        append_alert("<p>設定を適用するには<br>Twitterの再読み込みを行ってください。</p>");
    })
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