let block_list;
let block_regexp;
let s_key_down = null;
let debug_block_num_text = 0;
let debug_block_num = 0;
let shift_key_status = 0;
chrome.storage.local.get("cslp_settings", function(value){
    if(value.cslp_settings != undefined){
        if(JSON.parse(value.cslp_settings).filter_latest == true){
            main("https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@latest/filter.json");
        }else{
            main(chrome.runtime.getURL("filter.json"));
        }
    }else{
        main(chrome.runtime.getURL("filter.json"));
    }
});
function main(filter_url){
console.log("Clean-Spam-Link-Tweet is Working!");
if(filter_url == "https://cdn.jsdelivr.net/gh/kawa-nobu/Clean-Spam-Link-Tweet_Filter@latest/filter.json"){
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
                version:chrome.runtime.getManifest().version,
                filter_update:json[0].developer_update,
                filter_link:json[0].thanks_link,
                filter_thanks:json[0].thanks_name
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
            //メイン動作関数
            function run(){
                //TwitterCardではないスパムの場合
                for(let index = 0; index < document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]').length; index++){
                    debug_block_num_text += 1;
                    //ツイート内にリンク(要素全体)を検出
                    if(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index] != undefined){
                        //ヒットツイート削除設定無効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->阻止
                        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].textContent) && document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].getAttribute("cslt_flag") != "ok"){
                            let ins_html;
                            if(document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].offsetWidth < 100){
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
                    debug_block_num += 1;
                    //TwitterCard内にリンク(要素全体)を検出
                    if(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0] != undefined){
                        //ヒットツイート削除設定無効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->阻止
                        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].textContent) && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
                            //console.log("found!");
                            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
                            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>ヒットしたURL:${document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].textContent}<br>クリックでツイートを開く</p></div>`;
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
                            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
                            copy_url(index, debug_block_num, "tw_card");
                        }
                        //ヒットツイート削除設定有効で、リスト内に該当のURLが存在かつ阻止済フラグがあるかどうか->削除
                        if(cslp_settings.hit_del == true && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].textContent)){
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
            function copy_url(index, debug_block_num, mode) {
                if (cslp_settings.hit_url_copy == true) {
                    let node_index = null;
                  let debug_ins_html = `<div id="cslt_filter${debug_block_num}" class="cslt_copy_filter" style="width: 100%;height: 100%;position: absolute;z-index: 100;display: flex;align-items: center;text-align: center;justify-content: center;font-weight:bold;background-color: rgba(0,0,0,0.75);color: #fff;outline:solid 5px #ffab11;outline-offset:-5px;cursor:copy;visibility:hidden;">クリックでURLをコピー</div>`;
                  switch (mode) {
                    case "text":
                        document.querySelectorAll('[data-testid="tweetText"] a[target="_blank"]')[index].closest('[data-testid="cellInnerDiv"]').insertAdjacentHTML("afterbegin", debug_ins_html);
                        node_index = 0;
                        break;
                    case "tw_card":
                        document.querySelectorAll('[data-testid="card.wrapper"]')[index].closest('[data-testid="cellInnerDiv"]').insertAdjacentHTML("afterbegin", debug_ins_html);
                        node_index = 1;
                        break;
                  }
                  
                  document.getElementById(`cslt_filter${debug_block_num}`).addEventListener("click", function () {
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
                      if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                        navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href);
                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href}\r\n他の拡張機能との競合や広告をコピーした可能性があります。`);
                      } else {
                        get_blockurl(this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href).then(function (url) {
                          navigator.clipboard.writeText(url);
                          hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${url}`);
                        });
                      }
                      break;
                    case "1":
                      if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                        navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href);
                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスでコピーできませんでした。`);
                      } else {
                        navigator.clipboard.writeText(this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href);
                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href}`);
                      }
                      break;
                    case "2":
                      if (this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href.match(/([^\/]+)/g)[1] != "t.co") {
                        let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href;
                        navigator.clipboard.writeText(`${tco_addr},${tco_addr}`);
                        hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${tco_addr},${tco_addr}\r\n他の拡張機能との競合や広告であるため\r\nt.coのアドレスがコピーできませんでした。`);
                      } else {
                        let tco_addr = this.parentElement.querySelectorAll('[data-testid="card.wrapper"], [data-testid="tweetText"]')[node_index].querySelectorAll("a")[0].href;
                        get_blockurl(tco_addr).then(function (url) {
                          let cl_text = `${url},${tco_addr}`;
                          //console.log(cl_text);
                          navigator.clipboard.writeText(cl_text);
                          hide_cp_msg(`クリップボードにURLをコピーしました!\r\nCopy->${cl_text}`);
                        })
                      }
                      break;
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