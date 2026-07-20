/* 新クライアント向け投稿情報抽出 
非ログイン状態のクライアントを調査するしか私に出来る手がなかった...
調査と憶測で頑張って書いてみたが、これでログイン後に動くかわからない...
*/

(function () {
  //新しいクライアント上で動作させているかを検出する
  if (!window.__TSR_ROUTER__) {
    console.log("Use old client");
    return;
  }
  console.log("CSLT Relay Analyze Script is Working!");

  //ユーザーに本モードで動作していることを通知(実装完了後に削除する)
  setCompatibleModeUserMessage();

  /* React Relay Environment 取得 */

  //Relay Environmentキャッシュ
  let _env = null;

  //ReactFiber取得
  function getFiber(element) {
    const key = Object.keys(element).find((k) => k.startsWith("__reactFiber$"));
    return key ? element[key] : null;
  }

  //Fiberの中からRelay Environmentを取得する
  function findRelayEnv(obj, depth = 0, visited = new WeakSet()) {
    // 捜索の深さ6超えか、循環参照なら取得を打ち切る
    if (!obj || typeof obj !== "object" || depth > 6 || visited.has(obj))
      return null;

    visited.add(obj);

    if (typeof obj.getStore === "function" && typeof obj.lookup === "function")
      return obj;

    for (const key of Object.keys(obj)) {
      try {
        //子プロパティを再帰で探索する
        const found = findRelayEnv(obj[key], depth + 1, visited);
        if (found) return found;
      } catch {}
    }
    return null;
  }

  //Relay Environmentを取得する
  function getRelayEnv() {
    //キャッシュ済みならそのまま返す
    if (_env) return _env;

    //Fiberを探る対象を指定
    const rootTargets = [
      document.querySelector("main"),
      document.getElementById("react-root"),
      document.body,
    ];

    for (const target of rootTargets) {
      if (!target) continue;

      // DOM要素からFiberを取得
      let fiberNode = getFiber(target);

      while (fiberNode) {
        //Fiberの props/state/インスタンスの中を探す
        for (const propsSource of [
          fiberNode.memoizedProps,
          fiberNode.memoizedState,
          fiberNode.stateNode,
        ]) {
          const found = findRelayEnv(propsSource);

          //見つかったらキャッシュ上で返す
          if (found) {
            _env = found;
            return found;
          }
        }

        //親Fiberへ遡る
        fiberNode = fiberNode.return;
      }
    }
    //見つからなかった場合
    return null;
  }

  /* React Relay クエリ参照 */

  //refのIDを使って、Relayストアからレコードを取得する
  function get(src, ref) {
    //refが存在しない場合はそのまま返す
    if (!ref) return ref;

    //__refが存在している場合はストアからレコードを取得する
    if (ref.__ref) {
      const resolved = src.get(ref.__ref);

      if (resolved) return resolved;

      return null;
    }

    //クエリ参照でなければそのまま返す
    return ref;
  }

  //複数のrefのIDを使って、ストアからレコードを取得する
  function getRefs(src, field) {
    //fieldが無い、または__refs配列を持っていなければ空配列
    if (!field || !Array.isArray(field.__refs)) return [];

    //各IDの参照先をストアから引いて、存在するものだけ返す
    const results = [];
    for (const id of field.__refs) {
      const record = src.get(id);

      if (record) results.push(record);
    }

    return results;
  }

  //Relay EnvironmentのStoreからRecordSourceを取得する
  function getSource() {
    const store = _env.getStore();
    return store.getSource();
  }

  /* 便利関数 */

  //Unix時間からUTC文字列に変換に変換する
  function msToUTC(ms) {
    if (!ms) return null;

    return new Date(ms).toUTCString();
  }

  //画像情報が含まれたオブジェクトからURLを取得
  function getImgUrl(image) {
    if (!image) {
      return null;
    }
    if (image.image_url) {
      return image.image_url;
    }
    if (image.url) {
      return image.url;
    }
    if (image.image_url_https) {
      return image.image_url_https;
    }
    return null;
  }

  /* センシティブ情報レコード取得 */

  // 添付メディアの閲覧注意警告の有無からセンシティブ判定する
  function isSensitive(src, rec) {
    const medias = getRefs(src, rec.media_entities2);
    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      //警告レコードを取得
      let warning = get(src, media.sensitive_media_warning);

      //参照でない場合はそのまま
      if (!warning) {
        warning = media.sensitive_media_warning;
      }
      if (!warning) continue;

      // いずれかの警告フラグが立っていればセンシティブ
      if (warning.adult_content) return true;
      if (warning.graphic_violence) return true;
      if (warning.other) return true;
    }
    return false;
  }

  /* Card周りのオブジェクト取得 */

  function buildCardInfo(src, cardRef) {
    //カード情報レコードを取得
    const card = get(src, cardRef);
    if (!card) return { tw_card_obj: null, tw_card_unified_obj: null };

    //legacyフィールド内を探す
    const legacy = get(src, card.legacy);
    if (!legacy) return { tw_card_obj: null, tw_card_unified_obj: null };

    //binding_valuesの配列をオブジェクトに変換
    const bindings = {};
    const bindingList = getRefs(src, legacy.binding_values);
    for (let i = 0; i < bindingList.length; i++) {
      const binding = bindingList[i];

      // valueレコード取得
      let value = get(src, binding.value);
      if (!value) {
        value = binding.value;
      }

      //キーまたは値が無ければスキップ
      if (!value) continue;
      if (!binding.key) continue;

      if (value.type === "IMAGE") {
        //画像はさらにvalueレコードを取得する
        let imageValue = get(src, value.image_value);
        if (!imageValue) {
          imageValue = value.image_value;
        }
        bindings[binding.key] = imageValue;
      } else {
        //画像以外でさらにvalue周りを取得
        if (value.string_value !== undefined && value.string_value !== null) {
          bindings[binding.key] = value.string_value;
        } else if (
          value.boolean_value !== undefined &&
          value.boolean_value !== null
        ) {
          bindings[binding.key] = value.boolean_value;
        } else {
          bindings[binding.key] = value;
        }
      }
    }

    // TwitterCrad周りの情報を取得
    let tw_card_obj = null;
    if (bindings.domain) {
      const domainValue = bindings.domain;
      // domainが文字列ならそのまま、オブジェクトならstring_valueを取り出す
      if (typeof domainValue === "string") {
        tw_card_obj = { domain: domainValue };
      } else if (domainValue.string_value) {
        tw_card_obj = { domain: domainValue.string_value };
      } else {
        tw_card_obj = { domain: domainValue };
      }
    }

    // unified_card周りの情報を取得
    let tw_card_unified_obj = null;
    if (bindings.unified_card) {
      const unifiedCardValue = bindings.unified_card;
      //文字列ならJSONパースする。オブジェクトならそのまま
      if (typeof unifiedCardValue === "string") {
        try {
          tw_card_unified_obj = JSON.parse(unifiedCardValue);
        } catch (e) {
          //壊れたJSONが来ている場合は握りつぶす
        }
      } else {
        tw_card_unified_obj = unifiedCardValue;
      }
    }

    return {
      tw_card_obj: tw_card_obj,
      tw_card_unified_obj: tw_card_unified_obj,
    };
  }

  /* 動画情報を抽出 */

  function buildVideoInfo(src, mediaEntities) {
    const mediaList = getRefs(src, mediaEntities);
    if (mediaList.length === 0) return null;

    const result = [];
    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i];
      //動画メタ情報レコードを取得
      let videoInfo = get(src, media.video_info);
      if (!videoInfo) {
        videoInfo = media.video_info;
      }
      let type = media.type;

      if (type === "video" && videoInfo) {
        //動画の投稿元ユーザー情報レコードを取得
        let sourceUser = null;
        const additionalMediaInfo = get(src, media.additional_media_info);
        if (additionalMediaInfo) {
          //動画の作成元情報レコードを取得
          const sourceUserRef = get(src, additionalMediaInfo.source_user);
          let sourceUserResults = null;
          if (sourceUserRef) {
            sourceUserResults = get(src, sourceUserRef.user_results);
          }

          //作成元ユーザー情報レコードを取得
          let sourceUserRecord = null;
          if (sourceUserResults) {
            sourceUserRecord = get(src, sourceUserResults.result);
          }

          //ユーザー情報もレコードを取得してまとめる
          if (sourceUserRecord) {
            const sourceUserCore = get(src, sourceUserRecord.core);
            const sourceUserBio = get(src, sourceUserRecord.profile_bio);
            const sourceUserVerification = get(
              src,
              sourceUserRecord.verification,
            );
            const sourceUserLocation = get(src, sourceUserRecord.location);
            sourceUser = {
              user_data: {
                name: sourceUserCore ? sourceUserCore.name : null,
                description: sourceUserBio ? sourceUserBio.description : null,
                user_id: sourceUserRecord.rest_id,
                scr_name: sourceUserCore ? sourceUserCore.screen_name : null,
                all_tweet_count: null,
                is_blue:
                  sourceUserVerification &&
                  sourceUserVerification.is_blue_verified
                    ? true
                    : false,
                location: sourceUserLocation
                  ? sourceUserLocation.location
                  : null,
                account_create_date: null,
              },
            };
          }
        }

        //解像度情報などを取得
        const variants = getRefs(src, videoInfo.variants);

        // 最高画質を採用
        const bestVariant =
          variants.length > 0 ? variants[variants.length - 1] : null;

        result.push({
          type: "video",
          duration_ms: videoInfo.duration_millis,
          video_raw: bestVariant,
          video_source_user_info: sourceUser,
        });
      } else if (type === "animated_gif") {
        //GIFの情報を取得
        let gifVariants = [];
        if (videoInfo) {
          gifVariants = getRefs(src, videoInfo.variants);
        }
        const bestGifVariant =
          gifVariants.length > 0 ? gifVariants[gifVariants.length - 1] : null;

        result.push({
          type: "animated_gif",
          duration_ms: null,
          video_raw: bestGifVariant,
          video_source_user_info: null,
        });
      }
    }

    if (result.length === 0) {
      return null;
    }
    return result;
  }

  /* ユーザー情報周りのオブジェクト取得 */

  function extractUser(src, rec, userRef) {
    //ユーザー情報全体のレコードを取得
    const resolvedUserRef = get(src, userRef);
    let userResults = null;
    if (resolvedUserRef && resolvedUserRef.user_results) {
      userResults = get(src, resolvedUserRef.user_results);
    }

    //Userレコード本体を取得
    let userRecord = null;
    if (userResults && userResults.result) {
      userRecord = get(src, userResults.result);
    }

    //ユーザーが見つからない場合
    if (!userRecord) return { user: null, userData: null };

    /* 各サブフィールドのレコードを取得 */

    //名前/screen_name/作成日時
    const core = get(src, userRecord.core);

    //認証バッジ情報
    const verification = get(src, userRecord.verification);

    //ユーザー設定ロケーション
    const location = get(src, userRecord.location);

    //自己紹介文
    const bio = get(src, userRecord.profile_bio);

    //ツイート数
    const tweetCounts = get(src, userRecord.tweet_counts);

    //フォロー/フォロワー数
    const relationshipCounts = get(src, userRecord.relationship_counts);

    //鍵アカウント情報
    const privacy = get(src, userRecord.privacy);

    //アイコン画像URLを取得
    const avatarRef = get(src, userRecord.avatar);
    const profileImageUrl = getImgUrl(avatarRef);

    //ヘッダー画像URLを取得
    const bannerRef = get(src, userRecord.banner);
    const profileBannerUrl = getImgUrl(bannerRef);

    //取得した情報をCSLTで扱えるユーザーオブジェクトにまとめる
    const userData = {
      name: core ? core.name : null,
      description: bio ? bio.description : null,
      user_id: userRecord.rest_id,
      scr_name: core ? core.screen_name : null,
      all_tweet_count:
        tweetCounts && tweetCounts.tweets !== undefined
          ? tweetCounts.tweets
          : null,
      is_blue: verification && verification.is_blue_verified ? true : false,
      location: location ? location.location : null,
      account_create_date: core ? msToUTC(core.created_at_ms) : null,
      possibly_sensitive:
        userRecord.possibly_sensitive !== undefined
          ? userRecord.possibly_sensitive
          : null,
      protected: privacy && privacy.protected ? true : false,
      followers_count:
        relationshipCounts && relationshipCounts.followers !== undefined
          ? relationshipCounts.followers
          : null,
      friends_count:
        relationshipCounts && relationshipCounts.following !== undefined
          ? relationshipCounts.following
          : null,
      profile_image_url_https: profileImageUrl,
      profile_banner_url: profileBannerUrl,
      // 現時点で取得不能(将来ストアから取れるようになったら実装する)
      blocked_by: null,
      // ログイン時のみ値が入るはず...
      following:
        userRecord.is_following !== undefined ? userRecord.is_following : null,
    };

    return {
      user: userRecord,
      userData: userData,
    };
  }

  /* 報告用JSON生成 */

  function buildReportJson(
    rec,
    userId,
    screenName,
    permalink,
    isMedia,
    isPromoted,
  ) {
    //投稿の報告用
    const requestedVariant = {
      client_app_id: "3033300",
      client_location: "tweet:conversation_descendants:tweet",
      client_referer: permalink || "",
      is_media: isMedia,
      is_promoted: isPromoted,
      report_flow_id: "%cslt_random_uuid%",
      reported_tweet_id: rec.rest_id,
      reported_user_id: userId,
      source: "reporttweet",
    };

    const payload = {
      input_flow_data: {
        requested_variant: JSON.stringify(requestedVariant),
        flow_context: {
          debug_overrides: {},
          start_location: {
            location: "tweet",
            tweet: { tweet_id: rec.rest_id },
          },
        },
      },
    };
    return JSON.stringify(payload);
  }

  function buildUserReportJson(userId, screenName) {
    //ユーザーの報告用
    const requestedVariant = {
      client_app_id: "3033300",
      client_location: "profile:header:",
      client_referer: `/${screenName}`,
      is_media: false,
      is_promoted: false,
      report_flow_id: "%cslt_random_uuid%",
      reported_user_id: userId,
      source: "reportprofile",
    };
    const payload = {
      input_flow_data: {
        requested_variant: JSON.stringify(requestedVariant),
        flow_context: {
          debug_overrides: {},
          start_location: {
            location: "profile",
            profile: { profile_id: userId },
          },
        },
      },
    };
    return JSON.stringify(payload);
  }

  /* 投稿情報取得 */

  function toLegacyFormat(src, rec) {
    if (!rec) return null;

    //ツイート詳細レコードを取得
    let details = get(src, rec.details);
    if (!details) {
      details = {};
    }

    //ユーザー情報を取り出す
    const extracted = extractUser(src, rec, rec.core);
    const user = extracted.user;
    const userData = extracted.userData;

    //本文テキスト取得
    //長文ツイート(note_tweet)があればそちらを優先
    let text = details.full_text; //デフォルトは通常のfull_text
    const note = get(src, rec.note_tweet);
    if (note) {
      const noteResults = get(src, note.note_tweet_results);
      if (noteResults && noteResults.result) {
        const noteData = get(src, noteResults.result);
        if (noteData && noteData.text) {
          // 長文があればそちらを使う
          text = noteData.text;
        }
      }
    }

    //TwitterCardなどの情報を取得
    const cardInfo = buildCardInfo(src, rec.card);

    //本文中のURL一覧を取得
    const urls = getRefs(src, rec.url_entities);

    //引用の情報を取得
    let quoted_obj = null;
    if (rec.quoted_tweet_results) {
      // 引用の情報を取得する
      const quotedTweetResults = get(src, rec.quoted_tweet_results);
      let quotedResult = null;
      if (quotedTweetResults) {
        quotedResult = get(src, quotedTweetResults.result);
      }

      //引用の可視情報を取得
      let quotedTweet = quotedResult;
      if (
        quotedResult &&
        quotedResult.__typename === "TweetWithVisibilityResults"
      ) {
        quotedTweet = get(src, quotedResult.tweet);
      }

      //引用情報を従来の形式に変換
      if (quotedTweet && quotedTweet.__typename === "Tweet") {
        const quotedInfo = toLegacyFormat(src, quotedTweet);
        if (quotedInfo) {
          quoted_obj = {
            text: quotedInfo.text,
            mentions: quotedInfo.mentions,
            possibly_sensitive: quotedInfo.possibly_sensitive,
            possibly_sensitive_editable: false,
            quoted_urls: quotedInfo.attached_urls,
            tweet_lang: quotedInfo.tweet_lang,
            content_disclosure: quotedInfo.content_disclosure,
            user_data: quotedInfo.user_data,
          };
        }
      }
    }

    //メディア添付があるか
    const isMedia = getRefs(src, rec.media_entities2).length > 0;

    //広告の投稿を検出する
    const isPromoted = promotedSet.has(rec.rest_id);

    // ツイートへのパーマリンクパス
    let permalink = null;
    if (userData) {
      permalink = `/${userData.scr_name}/status/${rec.rest_id}`;
    }

    //報告用のユーザー情報
    const reportUserId = userData && userData.user_id ? userData.user_id : "";
    const reportScreenName =
      userData && userData.scr_name ? userData.scr_name : "";

    //コミュニティノート等の情報
    let contentDisclosure = get(src, rec.content_disclosure);
    if (!contentDisclosure) {
      contentDisclosure = null;
    }

    return {
      is_root_tweet: permalink === location.pathname,
      mentions: getRefs(src, rec.mention_entities),
      text: text,
      tweet_id: rec.rest_id,
      //現時点で取得不能(将来ストアから取れるようになったら取得できるようにする)
      tweet_client: null,
      is_reply: rec.reply_to_results ? true : false,
      is_user_data_only: false,
      //現時点で取得不能(同上)
      tweet_lang: null,
      is_promoted: isPromoted,
      grok_share_attachment: rec.grok_share_attachment
        ? rec.grok_share_attachment
        : null,
      content_disclosure: contentDisclosure,
      //メディアの警告フラグから判定する
      possibly_sensitive: isSensitive(src, rec),
      user_data: userData,
      tweet_video_info: buildVideoInfo(src, rec.media_entities2),
      report_json: buildReportJson(
        rec,
        reportUserId,
        reportScreenName,
        permalink,
        isMedia,
        isPromoted,
      ),
      user_report_json: buildUserReportJson(reportUserId, reportScreenName),
      quoted_obj: quoted_obj,
      tw_card_obj: cardInfo.tw_card_obj,
      tw_card_unified_obj: cardInfo.tw_card_unified_obj,
      attached_urls: urls.length > 0 ? urls : null,
    };
  }

  /* ユーザー情報単体を取得(フォロー・フォロワー欄等で使用) */
  function toUserOnlyFormat(src, userRec) {
    if (!userRec) return null;

    //ユーザー情報と認証済情報を取得
    const core = get(src, userRec.core);
    const verification = get(src, userRec.verification);

    //ユーザーID
    let userId = userRec.rest_id;
    if (!userId) {
      userId = "";
    }

    //スクリーンネーム
    let screenName = "";
    if (core && core.screen_name) {
      screenName = core.screen_name;
    }

    //認証付き情報
    let isBlue = false;
    if (verification && verification.is_blue_verified) {
      isBlue = true;
    }

    return {
      is_reply: false,
      is_user_data_only: true,
      user_data: {
        name: core ? core.name : null,
        user_id: userId,
        scr_name: screenName,
        all_tweet_count: null,
        is_blue: isBlue,
      },
      report_json: null,
      user_report_json: buildUserReportJson(userId, screenName),
    };
  }

  /* プロモーションの投稿のIDを収集する */
  const promotedSet = new Set();

  //promoted_metadataを持つレコードからプロモツイートのIDを収集する
  function collectPromotedIds() {
    if (!_env) return;
    const src = getSource();

    //ストア内の全レコードIDを列挙
    let ids;
    if (src.getRecordIDs) {
      ids = src.getRecordIDs();
    } else {
      ids = Object.keys(src.toJSON());
    }

    for (let i = 0; i < ids.length; i++) {
      const rec = src.get(ids[i]);
      if (!rec) continue;
      if (!rec.promoted_metadata) continue;

      //promoted_metadataを持つレコードからツイートIDを辿って収集する
      const tweetResults = get(src, rec.tweet_results);
      if (!tweetResults) continue;

      const tweetRecord = get(src, tweetResults.result);
      if (tweetRecord && tweetRecord.rest_id) {
        promotedSet.add(tweetRecord.rest_id);
      }
    }
  }

  //ツイートIDからストアのレコードを直接引いて従来形式の情報オブジェクトを返す
  function lookupTweet(tweetId) {
    if (!_env) return null;

    try {
      const src = getSource();

      //TweetResultsからツイートレコードを引く
      const tweetResults = src.get("TweetResults:" + tweetId);
      if (!tweetResults) return null;

      const rec = get(src, tweetResults.result);
      if (!rec) return null;
      if (rec.__typename !== "Tweet") return null;

      return toLegacyFormat(src, rec);
    } catch (e) {
      //取得失敗時は無視
    }
    return null;
  }

  /* DOMからでしか取れない情報を取得 */
  //ツイートのDOMにあるFiberからツイートIDを探す
  function getTweetId(element) {
    const fiber = getFiber(element);
    if (!fiber) return null;

    const key = fiber.memoizedProps?.children?.key;
    if (!key) return null;

    if (!key.startsWith("tweet-")) return null;

    return key.replace("tweet-", "");
  }

  /* ログインユーザー情報を取得 */
  // undefined=未解決, null=解決したが取得できず
  let _myScreenName;
  let _myUserId;

  function resolveLoginIdentity() {
    //解決済みなら何もしない
    if (_myScreenName !== undefined) return;

    _myScreenName = null;
    _myUserId = null;

    /* 
    予備実装。
    非ログイン状態でしか調査できていないため、ここの辺りは動かないと思われる...
    TODO:本格的に展開された後に調査して実装する
    */
    //初期化スクリプトからscreen_nameを取得
    try {
        //このセレクタは従来のもののため、新しいものでは確実に動かないと思われる
      const script = document.querySelector(
        'script[type="text/javascript"][charset="utf-8"][nonce]',
      );
      if (script) {
        const match = script.textContent.match(/"screen_name":"(.*?)"/);
        if (match) {
          _myScreenName = match[1];
        }
      }
    } catch (e) {
      //取得失敗は無視
    }

    //cookieからユーザーIDを取得（screen_nameが取れなかった場合の代替手段）
    try {
      const cookieMatch = document.cookie.match(/twid=u%3D(\d+)/);
      if (cookieMatch) {
        _myUserId = cookieMatch[1];
      }
    } catch (e) {
      // 取得失敗は無視
    }
  }

  //自分のツイートか判定する
  function isOwnTweet(userData) {
    resolveLoginIdentity();
    // screen_name で一致判定
    if (_myScreenName && userData && userData.scr_name === _myScreenName) {
      return true;
    }
    // user_id で一致判定（screen_nameが取れなかった場合用）
    if (_myUserId && userData && userData.user_id === _myUserId) {
      return true;
    }
    return false;
  }

  // 投稿などのデータをJSON文字列で属性に埋め込む
  function attachTweetInfo(element, info) {
    element.setAttribute("cslt_tweet_info", JSON.stringify(info));

    // フォロー中フラグ
    if (info.user_data && info.user_data.following) {
      element.setAttribute("cslt_tweet_info_following_flag", "true");
    }
    // 自分のツイートフラグ
    if (isOwnTweet(info.user_data)) {
      element.setAttribute("cslt_tweet_info_mytweet_flag", "true");
    }
    // Blueバッジフラグ
    if (info.user_data && info.user_data.is_blue) {
      element.setAttribute("cslt_tweet_info_isblue_flag", "true");
    }
  }

  //表示されているツイートから各種情報を取得して各DOM属性に情報を埋め込む
  function processArticles() {
    if (!_env) return;

    //プロモツイートIDを収集
    collectPromotedIds();

    //レンダリングされた未処理の投稿をまとめて取得する
    const tweets = document.querySelectorAll(
      "div[itemscope] ul li:not([cslt_tweet_info])",
    );
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      const tweetId = getTweetId(tweet);
      if (!tweetId) continue;

      const info = lookupTweet(tweetId);
      if (info) {
        attachTweetInfo(tweet, info);
      }
    }

    /* ユーザーページの処理 */
    //未処理のヘッダーを探す
    const userHeader = document.querySelector(
      'div[itemprop="mainEntity"]:not([cslt_user_page_info_element])',
    );
    if (!userHeader) return;
    if (!_env) return;

    // URLからスクリーンネームを取得
    const screenName = location.pathname.split("/")[1];
    if (!screenName) return;

    const src = getSource();
    let ids;
    if (src.getRecordIDs) {
      ids = src.getRecordIDs();
    } else {
      ids = [];
    }

    // 該当ユーザーを検索する
    for (let i = 0; i < ids.length; i++) {
      const rec = src.get(ids[i]);
      if (!rec) continue;
      if (rec.__typename !== "User") continue;

      const core = get(src, rec.core);
      if (!core) continue;

      // スクリーンネームが一致するUserレコードがあった場合
      if (core.screen_name !== screenName) continue;

      const formatted = toUserOnlyFormat(src, rec);
      if (formatted) {
        // ユーザー情報を属性に埋め込む
        userHeader.setAttribute(
          "cslt_tweet_info",
          JSON.stringify({ user_data_array: [formatted] }),
        );
        userHeader.setAttribute("cslt_user_page_user_scr_name", screenName);

        // 処理済みフラグ
        userHeader.setAttribute("cslt_user_page_info_element", "");
      }
      break;
    }
  }

  /* 情報抽出機能を起動する */
  let _processScheduled = false;
  let _ready = false;
  let _retries = 0;

  //起動
  function boot() {
    // Relay Environmentを探す
    const env = getRelayEnv();
    if (!env) {
      return false;
    }

    _ready = true;

    //起動時点で既にストアにあるプロモツイートIDを収集
    collectPromotedIds();

    processArticles();

    console.log("CSLT Relay Adapter: Ready");
    return true;
  }

  //Relay Environmentが見つかるまで起動をリトライ
  function tryBoot() {
    _retries++;
    //見つかったら終了
    if (boot()) return;
    //40回リトライしても見つからなければ諦める
    if (_retries > 40) {
      console.warn("CSLT Relay Adapter: Relay Environment not found");
      return;
    }

    //まだ見つからなければ次のリトライを予約
    setTimeout(tryBoot, 500);
  }
  setTimeout(tryBoot, 500);

  const mutationObserver = new MutationObserver(function () {
    // Relay Environmentがまだ見つかっていなければ何もしない
    if (!_ready) return;

    // 既に次フレームでの実行が予約済みならスキップ
    if (_processScheduled) return;
    _processScheduled = true;

    //1フレームにつき最大1回だけ抽出を行う
    requestAnimationFrame(function () {
      _processScheduled = false;
      processArticles();
    });
  });
  // ターゲットのDOM変更を監視
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  //本モード動作中メッセージ表示(完全な実装後に消す)
  function setCompatibleModeUserMessage() {
    const closeFlag = localStorage.getItem("cslt_2607_ref_msg_read");
    if (closeFlag === "true") return;

    class CsltCompatibleModeUserMessage extends HTMLElement {
      constructor() {
        super();
        this.alive = true;
        const shadow = this.attachShadow({ mode: "closed" });

        const style = document.createElement("style");
        style.textContent = `
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 8px;
        background: #ffeb3b66;
        font-size: 14px;
        font-family: sans-serif;
        box-sizing: border-box;
      }
      span {
        white-space: pre-line;
      }
    `;

        const text = document.createElement("div");
        text.innerHTML = `
    [CSLT開発者からのメッセージ]
    <br/>
    Xの大規模な仕様変更に伴い、 対策用の仮実装モードで動作しています。
    <br/>
    一部機能が正常に動作しない場合があります。
    <br/>
    現在復旧作業を進めておりますので、今しばらくお待ちください。
    <br/>
    <a href="https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/wiki/%E5%A4%A7%E8%A6%8F%E6%A8%A1%E3%81%AA%E4%BB%95%E6%A7%98%E5%A4%89%E6%9B%B4%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6" target="_blank" rel="noopener noreferrer">詳細はこちら<a/>
    （閉じると次回以降表示されません）`;

        const btn = document.createElement("button");
        btn.textContent = "閉じる";
        btn.addEventListener("click", () => {
          localStorage.setItem("cslt_2607_ref_msg_read", true);
          this.alive = false;
          this.remove();
        });

        shadow.append(style, text, btn);
      }

      disconnectedCallback() {
        if (!this.alive) return;
        setTimeout(() => document.body.prepend(this), 0);
      }
    }

    customElements.define("cslt-compatible-message-banner", CsltCompatibleModeUserMessage);
    document.body.prepend(new CsltCompatibleModeUserMessage());
  }
})();
