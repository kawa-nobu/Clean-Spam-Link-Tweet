chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //TweetDeckのバージョン判定Cookieを消す
        chrome.cookies.remove({url:"https://twitter.com/", name:"tweetdeck_version"}).then((resp) => {if(resp.name == "tweetdeck_version"){console.log("delete_ok")}});
        //TweetDeckのレガシーバージョン判定Cookieを追加する
        chrome.cookies.set({url:"https://twitter.com/", domain:".twitter.com", name:"tweetdeck_version", value:"legacy"}).then((resp) => {if(resp.name == "tweetdeck_version"){console.log("set_ok")}});
    }
  );
