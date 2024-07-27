console.log("CSLT Analyze Script is Working!");
//[role="group"]から一つ上の要素でも取れる。将来的に取れなくなったらそこから取るようにする
function get_tw_userdata(input_element, mode){
    const input_pr_array = Object.getOwnPropertyNames(input_element);
    const props_pr_name = input_pr_array.find((input)=>input.includes('__reactProps$'));
    const props_data = input_element[props_pr_name];
    switch(mode){
        case "user_page":
            return props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props?.user;
        case "user_page_ids":
            const user_obj = {
                userId: props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props.userId, 
                screen_name: props_data?.children[0][1]?.props?.children[0]?.props?.children[0]?.props?.screenName
            };
            return user_obj;
        case "reply":
            return props_data?.children[1]?.props?.retweetWithCommentLink?.state?.quotedStatus;
        case "login_user":
            return props_data?.children?.props?.children?.props?.children[1]?.props?.children?.props?.children?.props?.children?.props?.value?.loggedInUserId;
        case "user_page_info":
            return props_data?.children[0]?.props?.children[1]?.props?.user;
        case "settings_block_mute_user_id":
            return props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props?.userId;
    }
}
const root_elem = document.querySelector('#react-root');
//ログインユーザーID出力関数
function login_userid(){
    return document.querySelector('script[type="text/javascript"][charset="utf-8"][nonce]').textContent.match(/(?<="screen_name":")(.*)(?=","statuses_count")/g);
}
const tweet_obs = new MutationObserver(function(){
    //console.log("obs_load");
    let tweet_elem = null;
    let page_mode = null;
    const page_path = window.location.pathname.split("/")[2];
    const page_path_status = window.location.pathname.split("/")[4];
    switch (page_path) {
        case 'status':
            tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([cslt_tweet_process="ok"])');
            page_mode = 'status';
            break;
        case 'verified_followers':
        case 'followers':    
        case 'following':
            tweet_elem = document.querySelectorAll('section[role="region"] div[data-testid="cellInnerDiv"] div[role="button"][tabindex="0"][data-testid="UserCell"]:not([cslt_tweet_process="ok"]), section[role="region"] div[data-testid="cellInnerDiv"] [type="button"][data-testid="UserCell"]:not([cslt_tweet_process="ok"])');
            page_mode = 'followers';
            break;
        case 'communities':
            tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([cslt_tweet_process="ok"])');
            page_mode = 'communities';
            break;
        default:
            tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([cslt_tweet_process="ok"])');
            page_mode = 'other';
            break;
    }
    //ツイートのリツイート、いいね画面の場合
    if(page_path == 'status' && page_path_status == 'retweets' || page_path_status == 'likes'){
        tweet_elem = document.querySelectorAll('section[role="region"] div[data-testid="cellInnerDiv"] div[role="button"][tabindex="0"][data-testid="UserCell"]:not([cslt_tweet_process="ok"]), section[role="region"] div[data-testid="cellInnerDiv"] [type="button"][data-testid="UserCell"]:not([cslt_tweet_process="ok"])');
        //ユーザーが出て来るだけなのでフォロワー欄扱いで処理
        page_mode = 'followers';
    }
    //設定のブロックかミュートのページの場合
    /*if(window.location.pathname.split("/")[1] == 'settings' && page_path == 'blocked' || page_path == 'muted'){
        tweet_elem = document.querySelectorAll('section[role="region"] [data-testid="UserCell"][type="button"]:not([cslt_block_mute_list_user_id])');
        if(tweet_elem != null){
            page_mode = 'settings_block_mute';
        }
    }*/
    //
    for (let tweet_index = 0; tweet_index < tweet_elem.length; tweet_index++) {
        if(tweet_elem[tweet_index] != null){
            let video_info = [];
            switch (page_mode) {
                case 'status':
                    //console.log("status")
                    const tweet_info_reply = get_tw_userdata(tweet_elem[tweet_index], "reply");
                    console.log(tweet_info_reply)
                    if(tweet_info_reply != undefined){
                        //報告用JSON生成
                        let is_media_tweet = false;
                        let is_promo_tweet = false;
                        if(tweet_info_reply.extended_entities?.media != undefined){
                            is_media_tweet = true;
                        }
                        if(tweet_info_reply.promoted_content != undefined){
                            is_promo_tweet = true;
                        }
                        //動画情報取り出し
                        if(is_media_tweet){
                            const media_info_obj = tweet_info_reply.entities.media;
                            //console.log(media_info_obj)
                            for (let index = 0; index < media_info_obj.length; index++) {
                                if(media_info_obj[index].type == "video"){
                                    //console.log(media_info_obj[index])
                                    const media_info = {
                                        duration_ms: media_info_obj[index].video_info.duration_millis,
                                        video_raw: media_info_obj[index].video_info.variants.at(-1)
                                    }
                                    video_info.push(media_info);
                                }
                            }
                            if(video_info.length == 0){
                                video_info = null;
                            }
                        }else{
                            video_info = null;
                        }
                        const report_json_body = `{\"input_flow_data\":{\"requested_variant\":\"{\\\"client_app_id\\\":\\\"3033300\\\",\\\"client_location\\\":\\\"tweet:conversation_descendants:tweet\\\",\\\"client_referer\\\":\\\"${tweet_info_reply.permalink}\\\",\\\"is_media\\\":${is_media_tweet},\\\"is_promoted\\\":${is_promo_tweet},\\\"report_flow_id\\\":\\\"%cslt_random_uuid%\\\",\\\"reported_tweet_id\\\":\\\"${tweet_info_reply.id_str}\\\",\\\"reported_user_id\\\":\\\"${tweet_info_reply.user.id_str}\\\",\\\"source\\\":\\\"reporttweet\\\"}\",\"flow_context\":{\"debug_overrides\":{},\"start_location\":{\"location\":\"tweet\",\"tweet\":{\"tweet_id\":\"${tweet_info_reply.id_str}\"}}}},\"subtask_versions\":{\"action_list\":2,\"alert_dialog\":1,\"app_download_cta\":1,\"check_logged_in_account\":1,\"choice_selection\":3,\"contacts_live_sync_permission_prompt\":0,\"cta\":7,\"email_verification\":2,\"end_flow\":1,\"enter_date\":1,\"enter_email\":2,\"enter_password\":5,\"enter_phone\":2,\"enter_recaptcha\":1,\"enter_text\":5,\"enter_username\":2,\"generic_urt\":3,\"in_app_notification\":1,\"interest_picker\":3,\"js_instrumentation\":1,\"menu_dialog\":1,\"notifications_permission_prompt\":2,\"open_account\":2,\"open_home_timeline\":1,\"open_link\":1,\"phone_verification\":4,\"privacy_options\":1,\"security_key\":3,\"select_avatar\":4,\"select_banner\":2,\"settings_list\":7,\"show_code\":1,\"sign_up\":2,\"sign_up_review\":4,\"tweet_selection_urt\":1,\"update_users\":1,\"upload_media\":1,\"user_recommendations_list\":4,\"user_recommendations_urt\":1,\"wait_spinner\":3,\"web_modal\":1}}`;
                        //ツイート情報オブジェクト生成
                        let reply_quoted_obj = null;
                        let reply_out_urls = null;
                        let quoted_urls = null;
                        if(tweet_info_reply.quoted_status != undefined){
                            if(tweet_info_reply.quoted_status.entities.urls.length != 0){
                                quoted_urls = tweet_info_reply.quoted_status.entities.urls;
                            }
                            reply_quoted_obj = {
                                text:tweet_info_reply.quoted_status.full_text,
                                possibly_sensitive:tweet_info_reply.quoted_status.possibly_sensitive,
                                possibly_sensitive_editable:tweet_info_reply.quoted_status.possibly_sensitive_editable,
                                "quoted_urls":quoted_urls,
                                user_data:{
                                    name: tweet_info_reply.quoted_status.user.name, 
                                    user_id: tweet_info_reply.quoted_status.user.id_str,
                                    scr_name: tweet_info_reply.quoted_status.user.screen_name,
                                    all_tweet_count: tweet_info_reply.quoted_status.user.statuses_count
                                }
                            }
                        }
                        if(tweet_info_reply.entities.urls.length != 0){
                            reply_out_urls = tweet_info_reply.entities.urls;
                        }
                        const tweetinfo_attr_reply = {
                            text: tweet_info_reply.text,
                            tweet_id: tweet_info_reply.id_str, 
                            tweet_client: tweet_info_reply.source_name,
                            user_data:{
                                name: tweet_info_reply.user.name, 
                                user_id: tweet_info_reply.user.id_str,
                                scr_name: tweet_info_reply.user.screen_name,
                                all_tweet_count: tweet_info_reply.user.statuses_count,
                                view_blue: tweet_info_reply.user.is_blue_verified
                            },
                            tweet_video_info: video_info,
                            report_json: report_json_body,
                            "quoted_obj":reply_quoted_obj,
                            "reply_urls":reply_out_urls
                        };
                        //console.log(tweetinfo_attr_reply)
                        tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify(tweetinfo_attr_reply));
                    }
                    break;
                case 'followers':
                    //button __reactProps$3d2jw1jzxv2.children[0][1].props.children[1].props.children[1].props.userId
                    const view_user = window.location.pathname.split("/")[1];
                    const now_follow_mode = window.location.pathname.split("/")[2];
                    //console.log("follws_run")
                    if(login_userid() == view_user && now_follow_mode == "followers"){
                        const tweet_info_follow = get_tw_userdata(tweet_elem[tweet_index], "user_page");
                        console.log(tweet_info_follow)
                        if(tweet_info_follow != undefined){
                            //報告用JSON生成
                            const report_json_body = `{\"input_flow_data\":{\"requested_variant\":\"{\\\"client_app_id\\\":\\\"3033300\\\",\\\"client_location\\\":\\\"profile:header:\\\",\\\"client_referer\\\":\\\"/${tweet_info_follow.screen_name}\\\",\\\"is_media\\\":false,\\\"is_promoted\\\":false,\\\"report_flow_id\\\":\\\"%cslt_random_uuid%\\\",\\\"reported_user_id\\\":\\\"${tweet_info_follow.id_str}\\\",\\\"source\\\":\\\"reportprofile\\\"}\",\"flow_context\":{\"debug_overrides\":{},\"start_location\":{\"location\":\"profile\",\"profile\":{\"profile_id\":\"${tweet_info_follow.id_str}\"}}}}}`;
                            //ツイート情報オブジェクト生成
                            const tweetinfo_attr_follow = {
                                user_data:{
                                    name: tweet_info_follow.name, 
                                    user_id: tweet_info_follow.id_str,
                                    scr_name: tweet_info_follow.screen_name,
                                    all_tweet_count: tweet_info_follow.statuses_count,
                                    view_blue: tweet_info_follow.is_blue_verified
                                },
                                report_json: report_json_body
                            };
                            //console.log(tweet_info);
                            //console.log(tweetinfo_attr_follow)
                            tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify(tweetinfo_attr_follow));
                        }
                    }else{
                        const tweet_info_follow = get_tw_userdata(tweet_elem[tweet_index], "user_page_ids");
                        //console.log(tweet_info_follow)
                        const report_json_body = `{\"input_flow_data\":{\"requested_variant\":\"{\\\"client_app_id\\\":\\\"3033300\\\",\\\"client_location\\\":\\\"profile:header:\\\",\\\"client_referer\\\":\\\"/${tweet_info_follow.screen_name}\\\",\\\"is_media\\\":false,\\\"is_promoted\\\":false,\\\"report_flow_id\\\":\\\"%cslt_random_uuid%\\\",\\\"reported_user_id\\\":\\\"${tweet_info_follow.userId}\\\",\\\"source\\\":\\\"reportprofile\\\"}\",\"flow_context\":{\"debug_overrides\":{},\"start_location\":{\"location\":\"profile\",\"profile\":{\"profile_id\":\"${tweet_info_follow.userId}\"}}}}}`;
                        const tweetinfo_attr_follow = {
                            user_data:{
                                user_id: tweet_info_follow.userId,
                                scr_name: tweet_info_follow.screen_name
                            },
                            report_json: report_json_body
                        };
                        //console.log(tweet_info);
                        //console.log(tweetinfo_attr_follow)
                        tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify(tweetinfo_attr_follow));
                    }
                case 'other':
                    //console.log(window.location.pathname.split("/")[2])
                    //console.log("other")
                    //ユーザーページの場合
                    const user_page_header_item = document.querySelector('div[data-testid="UserName"]:not([cslt_tweet_process_user_info="ok"])');
                    if(user_page_header_item != null){
                        const user_page_info = get_tw_userdata(user_page_header_item, "user_page_info");
                        //console.log(user_page_info)
                        const report_json_body_user_page = `{\"input_flow_data\":{\"requested_variant\":\"{\\\"client_app_id\\\":\\\"3033300\\\",\\\"client_location\\\":\\\"profile:header:\\\",\\\"client_referer\\\":\\\"/${user_page_info.screen_name}\\\",\\\"is_media\\\":false,\\\"is_promoted\\\":false,\\\"report_flow_id\\\":\\\"%cslt_random_uuid%\\\",\\\"reported_user_id\\\":\\\"${user_page_info.id_str}\\\",\\\"source\\\":\\\"reportprofile\\\"}\",\"flow_context\":{\"debug_overrides\":{},\"start_location\":{\"location\":\"profile\",\"profile\":{\"profile_id\":\"${user_page_info.id_str}\"}}}}}`;
                        const userinfo_attr = {
                            user_data:{
                                name: user_page_info?.name, 
                                user_id: user_page_info?.id_str,
                                scr_name: user_page_info?.screen_name,
                                all_tweet_count: user_page_info?.statuses_count,
                                view_blue: user_page_info?.is_blue_verified
                            },
                            report_json: report_json_body_user_page
                        };
                        //console.log(userinfo_attr);
                        user_page_header_item.setAttribute("cslt_tweet_info", JSON.stringify(userinfo_attr));
                        user_page_header_item.setAttribute("cslt_tweet_process_user_info", "ok");
                    }
                    //
                    const tweet_info_other = get_tw_userdata(tweet_elem[tweet_index], "reply");
                    
                    //console.log(tweet_info_other)
                    if(tweet_info_other != undefined){
                        //報告用JSON生成
                        let is_media_tweet = false;
                        let is_promo_tweet = false;
                        if(tweet_info_other.extended_entities?.media[0] != undefined){
                            is_media_tweet = true;
                        }
                        if(tweet_info_other.promoted_content != undefined){
                            is_promo_tweet = true;
                        }
                        //動画情報取り出し
                        if(is_media_tweet){
                            const media_info_obj = tweet_info_other.entities.media;
                            //console.log(media_info_obj)
                            for (let index = 0; index < media_info_obj.length; index++) {
                                if(media_info_obj[index].type == "video"){
                                    //console.log(media_info_obj[index])
                                    const media_info = {
                                        duration_ms: media_info_obj[index].video_info.duration_millis,
                                        video_raw: media_info_obj[index].video_info.variants.at(-1)
                                    }
                                    video_info.push(media_info);
                                }
                            }
                            if(video_info.length == 0){
                                video_info = null;
                            }
                        }else{
                            video_info = null;
                        }
                        //ツイート情報オブジェクト生成
                        const report_json_body = `{\"input_flow_data\":{\"requested_variant\":\"{\\\"client_app_id\\\":\\\"3033300\\\",\\\"client_location\\\":\\\"tweet:conversation_descendants:tweet\\\",\\\"client_referer\\\":\\\"${tweet_info_other.permalink}\\\",\\\"is_media\\\":${is_media_tweet},\\\"is_promoted\\\":${is_promo_tweet},\\\"report_flow_id\\\":\\\"%cslt_random_uuid%\\\",\\\"reported_tweet_id\\\":\\\"${tweet_info_other.id_str}\\\",\\\"reported_user_id\\\":\\\"${tweet_info_other.user.id_str}\\\",\\\"source\\\":\\\"reporttweet\\\"}\",\"flow_context\":{\"debug_overrides\":{},\"start_location\":{\"location\":\"tweet\",\"tweet\":{\"tweet_id\":\"${tweet_info_other.id_str}\"}}}}}`;
                        const tweetinfo_attr_other = {
                            text: tweet_info_other?.text,
                            tweet_id: tweet_info_other?.id_str, 
                            tweet_client: tweet_info_other?.source_name,
                            user_data:{
                                name: tweet_info_other?.user.name, 
                                user_id: tweet_info_other?.user.id_str,
                                scr_name: tweet_info_other?.user.screen_name,
                                all_tweet_count: tweet_info_other?.user.statuses_count,
                                view_blue: tweet_info_other?.user.is_blue_verified
                            },
                            tweet_video_info: video_info,
                            report_json: report_json_body
                        };
                        tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify(tweetinfo_attr_other));
                    }
                    break;
                case 'communities':
                    const tweet_info_communities = get_tw_userdata(tweet_elem[tweet_index], "reply");
                    if(tweet_info_communities != undefined){
                        //報告用JSON生成
                        let is_media_tweet = false;
                        let is_promo_tweet = false;
                        if(tweet_info_communities.extended_entities?.media != undefined){
                            is_media_tweet = true;
                        }
                        if(tweet_info_communities.promoted_content != undefined){
                            is_promo_tweet = true;
                        }
                        //動画情報取り出し
                        if(is_media_tweet){
                            const media_info_obj = tweet_info_communities.entities.media;
                            //console.log(media_info_obj)
                            for (let index = 0; index < media_info_obj.length; index++) {
                                if(media_info_obj[index].type == "video"){
                                    //console.log(media_info_obj[index])
                                    const media_info = {
                                        duration_ms: media_info_obj[index].video_info.duration_millis,
                                        video_raw: media_info_obj[index].video_info.variants.at(-1)
                                    }
                                    video_info.push(media_info);
                                }
                            }
                            if(video_info.length == 0){
                                video_info = null;
                            }
                        }else{
                            video_info = null;
                        }
                        //ツイート情報オブジェクト生成
                        const report_urlparam = `client_location=community:ranked:suggest_community_tweet&client_referer=${window.location.pathname}&client_app_id=3033300&source=reporttweet&report_flow_id=%cslt_random_uuid%&reported_user_id=${tweet_info_communities.user.id_str}&reported_tweet_id=${tweet_info_communities.id_str}&initiated_in_app=1&lang=ja`;
                        const tweetinfo_attr_communities = {
                            text: tweet_info_communities?.text,
                            tweet_id: tweet_info_communities?.id_str, 
                            tweet_client: tweet_info_communities?.source_name,
                            is_promoted: is_promo_tweet,
                            user_data:{
                                name: tweet_info_communities?.user.name, 
                                user_id: tweet_info_communities?.user.id_str,
                                scr_name: tweet_info_communities?.user.screen_name,
                                all_tweet_count: tweet_info_communities?.user.statuses_count,
                                view_blue: tweet_info_communities?.user.is_blue_verified
                            },
                            tweet_video_info: video_info,
                            report_param: report_urlparam
                        };
                        tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify(tweetinfo_attr_communities));
                    }
                    break;
                case 'settings_block_mute':
                    const block_mute_list_userid = get_tw_userdata(tweet_elem[tweet_index], "settings_block_mute_user_id");
                    tweet_elem[tweet_index].setAttribute("cslt_block_mute_list_user_id", block_mute_list_userid);
                    console.log(block_mute_list_userid)
                    break;
                default:
                    tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("cslt_tweet_info", JSON.stringify({status:null}));
                    break;
            }
            tweet_elem[tweet_index].setAttribute("cslt_tweet_process", "ok");
        }else{
            tweet_elem[tweet_index].setAttribute("cslt_tweet_process", "ok");
        }
        
    }
});
tweet_obs.observe(root_elem, {
    childList: true,
    subtree: true
});