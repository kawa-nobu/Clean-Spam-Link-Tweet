# Clean-Spam-Link-Tweet(CSLT)
![icon](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/a36bab27-7701-428a-b0f3-9b8e0f71514c)

Twitterに良く出現するナイト系スパムツイート(リプライ)を間違えて踏む事の無い様にするための拡張機能です。

個人で使用するために作成したのでオレオレ仕様です。

以前作ったClean-DLSiteをベースに作成。

**使用前**<img width="241" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/a3913e60-c456-46ca-9594-68ab0d9c1547">
**使用後**<img width="281" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/de38f8bb-50b4-48bf-9ba0-d5e02e16cc13">

<img width="500" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/6fa518f5-b2af-4fa6-bd6d-5a6bf826d1d1">

**ヒットしたツイートの非表示もできます!**

## 搭載機能
<img width="500px" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/f60777af-8ada-41c2-86ee-fd427fcdfa3f">

* 阻止ツイート(ヒットツイート)の非表示機能
* Amazon.co.jpリンクの阻止(同時に非表示機能をONにすると一緒に非表示になります)
- 調査・開発者用機能
  - URLコピー機能(コピー項目はプルダウンメニューにより選択可、**FireFox、Kiwi Browser等では無効化**)
  - 設定初期化機能

## 使用方法(Chrome Web Store経由) **[推奨]**
[Chrome Web Storeのリンク](https://chrome.google.com/webstore/detail/clean-spam-link-tweet/bniigfmpkmcabajbkelbmphoelijoang) より、 

[Chrome(Brave等)に追加]ボタン押下で簡単にお使いの端末へ導入が完了します。 **AndroidユーザーはKiwi Browserで使えます！**

* 追加後、設定の構築を行う為、画面に表示されるメッセージに従ってTwitterの再読み込みやTwitterを開いてください。

**※追加で設定したい場合は拡張機能のポップアップメニューを開いて設定し、表示された指示に従ってください。**

[動作確認URL](https://twitter.com/search?q=bnc.lt&f=live)

**※Chrome Web Store経由で追加した場合、アップデートはお使いのブラウザが自動的に行いますので常に最新の状態で使用できます。**

## 使用方法(Mozilla公式サイト経由) **[推奨]**
**FireFoxの仕様により、現在URLコピー機能が利用できません。同様にAndroid版のFireFoxでは満足のいく動作は現時点で出来ていません。**

[addons.mozilla.org(AMO)](https://addons.mozilla.org/ja/firefox/addon/clean-spam-link-tweet/) より、 

[Firefox へ追加]ボタン押下で簡単にお使いの端末へ導入が完了します。 

* 追加後、設定の構築を行う為、画面に表示されるメッセージに従ってTwitterの再読み込みやTwitterを開いてください。

**※追加で設定したい場合は拡張機能のポップアップメニューを開いて設定し、表示された指示に従ってください。**

**※Android版のFireFoxでは、一応動作はしますがTwitterのタブを新規で開く毎に拡張機能の設定画面を一度開く必要があります。**

[動作確認URL](https://twitter.com/search?q=bnc.lt&f=live)

## 使用方法(デベロッパーモード)

1.[ここ](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/releases)から最新のリリースをダウンロード(例: v1.zip)

2.ダウンロードしたら任意の所でzipの解凍をする。

3.ChromeのURL欄から「chrome://extensions/」にアクセス(FireFox以外のBraveやEdgeのChromiumベースのブラウザに対応)

4.右上の「デベロッパー モード」部分横のスイッチを押す

5.「パッケージ化されていない拡張機能を読み込む」をクリック

6.先ほど解凍したフォルダ(v1等)を選択

7.導入は完了しました。設定の構築を行う為、画面に表示されるメッセージに従ってTwitterの再読み込みやTwitterを開いてください。

8.お疲れ様でした! 設定が完了しました！追加で設定したい場合は拡張機能のポップアップメニューを開いて設定し、表示された指示に従ってください。

[動作確認URL](https://twitter.com/search?q=bnc.lt&f=live)

※デベロッパーモード経由で追加した場合、アップデートは自動的に行われません。

新バージョンがリリースされた際に上記手順を行う必要があります。

**※常に最新のバージョンで使用したい場合は[Chrome Web Store](https://chrome.google.com/webstore/detail/clean-spam-link-tweet/bniigfmpkmcabajbkelbmphoelijoang)より追加を行って下さい**

## ポップアップメニュー(設定画面の出し方)
**下記手順はBraveの場合です。**

![image](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/014b0f54-dfe3-4b60-a953-e484cf259e11)
![image](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/bad92ba2-c397-40a1-b8fb-59a9386d6ef5)

1.ブラウザ画面右上のパズルの様なアイコンをクリック

2.Clean-Spam-Link-Tweet欄横のピンアイコンをクリック

3.Clean-Spam-Link-Tweetのアイコンをクリック

4.ポップアップメニューが出ます。

## URLコピー機能の使い方
**※FireFoxでは無効化しています。**
**※あらかじめ、設定画面にてコピー機能の有効化とコピーしたい種類の選択を行ってください。**
<img width="500" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/0075c37f-595f-4d4c-a71d-57ea3fc226e1">

1.[左Ctrl]キーの押下で、スパムツイートがブラックアウトします。ブラックアウトしたコピーしたいスパムツイートをクリックでクリップボードへコピーされます。

2.[OK]または、Enterキーを押してメッセージを閉じます。

**注意1:他の拡張機能(PageExpand等)との競合がある可能性がある為、t.co等のリンクが取れない可能性があります。**

**注意2:コピー後、稀にブラックアウトが解除されない事があります。その場合は、もう一度[左Ctrl]キーの押下で解除されます。**

## Special Thanks
- [孤迂闊ℹ️貴方がRTいいねしたツイ、スパムかもしれませんよ 様](https://twitter.com/xE0a2jI82zZuLFG) (リスト提供ありがとうございます!)
  - [リストURL](https://privatter.net/p/9889173)
