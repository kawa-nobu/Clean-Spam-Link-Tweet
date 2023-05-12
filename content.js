console.log("Block-Spam-Link-Tweet is Working!");

let block_list;
let block_regexp;
fetch(chrome.runtime.getURL('filter.json'), {
    method: "GET",
    cache: "no-store"
}).then(response => {
    if (!response.ok) {
        console.error('List load error!');
    }
    return response.json();
}).then(json => {
    console.log(`List Load!\r\nList update:${json[0].developer_update}\r\nList provider:${json[0].thanks_link}\r\nThanks '${json[0].thanks_name}' !`);
    block_regexp = new RegExp(json[2].concat_regex);
    //block_list = json;
    /*
    //結合された正規表現を作成するときに使う
    let concat_list = new Array();
    for (let index_b = 0; index_b < json[1].length; index_b++) {
        //console.log(index_b)
        concat_list.push(`${json[1][index_b].regex}|`)
    }
    console.log(`(${concat_list.join("")})`)
    */
}).catch(error => {
    console.error('List load error!', error);
});

const target_elem = document.getElementById("react-root");
function run(){
    for (let index = 0; index < document.querySelectorAll('[data-testid="card.wrapper"]').length; index++) {
        if(block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].innerText) && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
            //console.log("found!");
            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>クリックでツイートを開く</p></div>`;
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
        }
    }
};
const observer = new MutationObserver(run)
observer.observe(target_elem,{
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
});
/*
for (let index = 0; index < document.querySelectorAll('[data-testid="card.wrapper"]').length; index++) {
        if(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].innerText == 'bnc.lt' && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
            //console.log("found!");
            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>クリックでツイートを開く</p></div>`;
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
        }
    }
*/