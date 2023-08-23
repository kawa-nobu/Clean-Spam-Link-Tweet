if(location.href == "https://tweetdeck.twitter.com/"){
    function wait(set_num) {
        var start_time = new Date();
        while (new Date()-start_time<set_num);
    };
    if(confirm("OKを押して画面を数クリックしてください。\r\n「このサイトを離れますか?」の表示でキャンセルをクリックします。\r\n Press OK and click the screen a few clicks.\r\n \"Do you want to leave this site?\" and click Cancel.")){
        wait(1500);
    };
    //window.location.replace()検出
    window.onbeforeunload = function() {
        return "「このサイトを離れますか?」の表示でキャンセルをクリックします。\r\n Press OK and click the screen a few clicks.\r\n \"Do you want to leave this site?\" and click Cancel.";
    };
}
chrome.runtime.sendMessage({message: "wake_up"});
if(location.href == "https://twitter.com/i/premium_sign_up"){
    if(confirm("TweetDeck(X Pro)へ移動しますか?\r\nWould you like to move to TweetDeck(X Pro)?")){
        location.href = "https://tweetdeck.twitter.com/";
    }
}