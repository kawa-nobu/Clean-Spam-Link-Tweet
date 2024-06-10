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
<img width="500px" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/cfe368b3-e1f6-48a1-ada7-ebc2123144e7">

* 阻止ツイート(ヒットツイート)の非表示機能
* 活動停止済(無効ドメイン)阻止機能
* Amazon.co.jpリンクの阻止(同時に非表示機能をONにすると一緒に非表示になります)
* 常に最新のリスト利用機能(定義用リポジトリhttps://github.com/kawa-nobu/Clean-Spam-Link-Tweet_Filter)
- 調査・開発者用機能
  - URLコピー機能(コピー項目はプルダウンメニューにより選択可)
  - 設定初期化機能

## 使用方法(Chrome Web Store経由) **[推奨]**
[Chrome Web Storeのリンク](https://chrome.google.com/webstore/detail/clean-spam-link-tweet/bniigfmpkmcabajbkelbmphoelijoang) より、 

[Chrome(Brave等)に追加]ボタン押下で簡単にお使いの端末へ導入が完了します。 **AndroidユーザーはKiwi Browserで使えます！**

* 追加後、設定の構築を行う為、画面に表示されるメッセージに従ってTwitterの再読み込みやTwitterを開いてください。

**※追加で設定したい場合は拡張機能のポップアップメニューを開いて設定し、表示された指示に従ってください。**

[動作確認URL](https://twitter.com/search?q=bnc.lt&f=live)

**※Chrome Web Store経由で追加した場合、アップデートはお使いのブラウザが自動的に行いますので常に最新の状態で使用できます。**

## 使用方法(Mozilla公式サイト経由) **[推奨]**

[addons.mozilla.org(AMO)](https://addons.mozilla.org/ja/firefox/addon/clean-spam-link-tweet/) より、 

[Firefox へ追加]ボタン押下で簡単にお使いの端末へ導入が完了します。 

* 追加後、設定の構築を行う為、画面に表示されるメッセージに従ってTwitterの再読み込みやTwitterを開いてください。

**※追加で設定したい場合は拡張機能のポップアップメニューを開いて設定し、表示された指示に従ってください。**

[動作確認URL](https://twitter.com/search?q=bnc.lt&f=live)

### Android版FireFox(Beta、Nightly)の場合
- ユーザー ID:17926836
- コレクション名:cslt

**Android版FireFox(Beta、Nightly)バージョン113以上、カスタムアドオンコレクション経由で導入してください。**

**対応はしていますが、通常版のFireFoxでは導入できない為Kiwi Browserでの使用を推奨します。**

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

## 使用方法(iOS/iPadOSの場合)
- [AppStore](https://apps.apple.com/jp/app/clean-spam-link-tweet/id6503911724)よりインストールを行ってください
- Clean-Spam-Link-Tweetアプリの記載されている手順通りに設定を行ってください

## 使用方法(iOS/iPadOS用、Xcodeよりビルド)
**MacとXcodeが必要になります。MacOS以外では基本的にこの方法は実行できません**
**Developerアカウントの種類により1週間ごとに再ビルド・インストールが必要なる場合があります。**
- Chromeブランチをgit cloneする
- Xcodeに付属するsafari-web-extension-converterを使ってgit cloneしたディレクトリを指定してXcodeプロジェクトにコンバートを行う
  - 詳細な方法は[Appleのドキュメント](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari) を確認願います
- Bundle IdentifierやDeveloperアカウントの設定を行う
- ビルド・アーカイブ化し、お使いの端末へインストールする
- 設定アプリ=>Safariの拡張機能設定より、「twitter .com」、「x .com」のアクセス権を許可する
- Safariを開き、 Twitterへアクセスし、初期設定構築を行う
- アドレスバーにあるアイコンから拡張機能の画面へアクセスしお好みの設定を行い、メッセージに従う

## ポップアップメニュー(設定画面の出し方)
**下記手順はBraveの場合です。**

![image](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/014b0f54-dfe3-4b60-a953-e484cf259e11)
![image](https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/bad92ba2-c397-40a1-b8fb-59a9386d6ef5)

1.ブラウザ画面右上のパズルの様なアイコンをクリック

2.Clean-Spam-Link-Tweet欄横のピンアイコンをクリック

3.Clean-Spam-Link-Tweetのアイコンをクリック

4.ポップアップメニューが出ます。

## URLコピー機能の使い方
**※あらかじめ、設定画面にてコピー機能の有効化とコピーしたい種類の選択を行ってください。**
<img width="500" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/0075c37f-595f-4d4c-a71d-57ea3fc226e1">

1.[左Ctrl]キーの押下で、スパムツイートがブラックアウトします。ブラックアウトしたコピーしたいスパムツイートをクリックでクリップボードへコピーされます。

2.[OK]または、Enterキーを押してメッセージを閉じます。

**注意1:他の拡張機能(PageExpand等)との競合がある可能性がある為、t.co等のリンクが取れない可能性があります。**

**注意2:コピー後、稀にブラックアウトが解除されない事があります。その場合は、もう一度[左Ctrl]キーの押下で解除されます。**

### コピーURL組み替え機能
<img width="161" alt="image" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/1832b163-5eef-4c5b-b2c1-fba88dc7795b">

Ver.1.8からURL組み替え機能を実装しました。  
この機能は、比較的自由な形式でスパムのURLのコピー項目を選択・組み替えできる為、  
お使いの調査環境に適した形式でスパム調査が出来る機能です。

#### 使い方
1.「ヒットURLコピー」を有効にします  
2.「ヒットURLコピーオプション」の項目を「組み替え」に設定します  
3.標準で既に取得できるすべての項目がカンマ切りでコピーされるように設定されている為、変更する必要が無ければそのままお使いください。  
#### 組み替え方法
<img width="161" alt="image" src="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/assets/44832116/3d84497b-47d6-49e9-9430-bffb2c3988cc">

1.「コピー項目組み替え」のテキストボックス内の値を変更してください  
2.変更後、「Enterキー」や設定画面内のどこかをクリックします  
3.コピー項目のプレビューとメッセージが表示されるので確認後、指示に従ってください  
#### コピー項目の変数仕様
| 変数 | 変数説明 |
| ---- | ---- |
| %t_co% | t.coアドレス |
| %bl_url% | ブロックURL |
| %adv_addr% | 解析URL(「ヒットURL解析」がオフの場合はnull代入。解析のアドレスが複数あった場合、カンマ切りで代入。) |
| %tw_id% | ツイートのID |
| %tw_date% | ツイート日時(yyyy_mm_dd_hh_mm_ss) |
#### 例
設定:%bl_url%<=>%adv_addr%<=>%tw_id% **(ブロックURL<=>解析URL<=>ツイートID)**  
コピー結果: https ://xxx.xxx/xxx<=>https ://www .spam.xxx/xxx<=>1234567890123456789
#### 注意
**※各変数は「%」で囲まれている事を確認してください**  
#### 「コピー項目組み替え」の初期値
```
%t_co%,%bl_url%,%adv_addr%,%tw_id%,%tw_date%
```

## Special Thanks
- [孤迂闊ℹ️貴方がRTいいねしたツイ、スパムかもしれませんよ 様](https://twitter.com/xE0a2jI82zZuLFG) (リスト提供ありがとうございます!)
  - [リストURL](https://privatter.net/p/9889173)
