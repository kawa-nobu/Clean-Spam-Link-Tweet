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
            alert("設定を構築する為、Twitterを開くか再読み込みをしてください。")
            window.close();
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
    })
    document.getElementById("filter_sw").addEventListener("change", function(){
        cslp_settings.filter = document.getElementById("filter_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        alert("設定を適用するには\r\nTwitterを再読み込みを行ってください。");
    })
    document.getElementById("hit_tweet_sw").addEventListener("change", function(){
        cslp_settings.hit_del = document.getElementById("hit_tweet_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        alert("この機能はTwitterの動作が遅くなる可能性があります。\r\n設定を適用するにはTwitterを再読み込みを行ってください。")
    })
    document.getElementById("amz_aff_sw").addEventListener("change", function(){
        cslp_settings.amazon_hit = document.getElementById("amz_aff_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        alert("設定を適用するには\r\nTwitterを再読み込みを行ってください。");
    })
    document.getElementById("hiturl_copy_sw").addEventListener("change", function(){
        cslp_settings.hit_url_copy = document.getElementById("hiturl_copy_sw").checked;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        alert("設定を適用するには\r\nTwitterを再読み込みを行ってください。");
    })
    document.getElementById("hiturl_copy_opt").addEventListener("change", function(){
        cslp_settings.hit_url_copy_mode = document.getElementById("hiturl_copy_opt").value;
        chrome.storage.local.set({'cslp_settings': JSON.stringify(cslp_settings)}, function () {
            console.log(cslp_settings);
        });
        alert("設定を適用するには\r\nTwitterを再読み込みを行ってください。");
    })
    document.getElementById("settings_reset_sw").addEventListener("click", function(){
        chrome.storage.local.remove("cslp_settings", function(value){
            alert("設定を初期化しました。\r\nTwitterを再読み込みしてください。");
        });
    })
})