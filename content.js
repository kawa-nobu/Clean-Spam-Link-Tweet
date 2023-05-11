console.log("Block-Spam-Link-Tweet is Working!");
const target_elem = document.getElementsByTagName("main")[0];
function run(){
    let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>クリックでツイートを開く</p></div>`;
    for (let index = 0; index < document.querySelectorAll('[data-testid="card.wrapper"]').length; index++) {
        if(document.querySelectorAll('[data-testid="card.wrapper"]')[index].innerText.indexOf("bnc.lt") != -1 && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("bslt_flag") != "ok"){
            //console.log("found!");
            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("bslt_flag", "ok");
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
