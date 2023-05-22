self.addEventListener( "message" , function(message){
    console.log("OK"+message);
})
/*const target_elem = document.getElementById("react-root");
function run(){
    console.log("del"+cslp_settings.hit_del)
    for (let index = 0; index < document.querySelectorAll('[data-testid="card.wrapper"]').length; index++) {
        if(cslp_settings.hit_del == false && block_regexp.test(document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].innerText) && document.querySelectorAll('[data-testid="card.wrapper"]')[index].getAttribute("cslt_flag") != "ok"){
            //console.log("found!");
            //console.log(document.querySelectorAll('[data-testid="card.wrapper"]')[index]);
            let ins_html = `<div style="position: absolute;z-index: 99999;width: 100%;height: 100%;display: flex;align-items: center;text-align: center;justify-content: center;background-color: rgba(0,0,0,0.75);color: #fff;border-radius: 16px;"><p>スパムを検出!<br>ヒットしたURL:${document.querySelectorAll('[data-testid="card.wrapper"]')[index].querySelectorAll('[dir="auto"]')[0].innerText}<br>クリックでツイートを開く</p></div>`;
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].setAttribute("cslt_flag", "ok");
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].insertAdjacentHTML("beforebegin", ins_html);
        }
        if(cslp_settings.hit_del == true){
            document.querySelectorAll('[data-testid="card.wrapper"]')[index].closest('[data-testid="cellInnerDiv"]').style.display = "none";
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
}*/