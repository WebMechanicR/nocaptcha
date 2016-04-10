
/* SETTINGS */

var performTimeout = 300*1000; //300sec
var captchaRecognizingTimeout = 210*1000; //210 sec
var captchaResourceTimeout = 20*1000; //IMPORTANT FOR CHANGING 20sec
var yandexTranslatorAPIKey = "trnsl.1.1.20151130T041314Z.4fb919c9e1da67f0.c50686e8e3e2d7b5eaa9e563a4a1b1f2f5537dbd";

var commandLinePHPRun = ["php", ["-f", "query.php"]];

/* END SETTINGS */

var webPage = require('webpage');
var system = require('system');
var filesystem = require('fs');
var execFile = require("child_process").execFile

var siteKeyParam = "";
var siteUrlParam = "";
var proxyAddrParam = "";
var proxyUserPwParam = "";

if (system.args.length < 3) {
  console.log('Pass site key and site url arguments when invoking this script!');
} else {
  system.args.forEach(function(arg, i) {
      if(i == 1)
          siteKeyParam = arg;
      else if(i == 2)
          siteUrlParam = arg;
      else if(i == 3)
          proxyAddrParam = arg;
      else if(i == 4)
          proxyUserPwParam = arg
  });
}

if(proxyAddrParam){
    proxyAddrParam = proxyAddrParam.split(":");
    var proxy = proxyAddrParam[0];
    var port = proxyAddrParam[1];
    var user = '', psw = '';
    if(proxyUserPwParam){
        proxyUserPwParam = proxyUserPwParam.split(":");
        user = proxyUserPwParam[0];
        psw = proxyUserPwParam[1];
    }
    phantom.setProxy(proxy, port, 'manual', user, psw);
}

var page = webPage.create();

page.onConsoleMessage = function(msg) {
    if(/^PHJS:/.test(msg))
        console.log(msg);
};
var myUserAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36 OPR/34.0.2036.25';
page.settings.webSecurityEnabled =  false;
page.settings.userAgent = myUserAgent;
page.settings.resourceTimeout =  captchaResourceTimeout;
page.viewportSize = { width: 1920, height: 1080 };


page.onInitialized = function() {
  page.evaluate(function(myUserAgent) {
        var __originalNavigator = navigator;
        navigator = new Object();
        navigator.__proto__ = __originalNavigator;
        navigator.__defineGetter__('userAgent', function () { return myUserAgent; });
        window.callPhantom = undefined;
        window._phantom = undefined;
  }, myUserAgent);
  
  page.customHeaders = {
    "User-Agent": myUserAgent,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
};

var firstPageLoading = false;
var resourceIframeLoaded = false;
page.onLoadFinished = function(status) {
    if (status === 'success' && !firstPageLoading) {
          firstPageLoading = true;
          Sys.log("Page loaded!");
          
          page.evaluate(function(myUserAgent, mLog) {
            document.addEventListener ('DOMSubtreeModified', 
                  function(){
                      if(window.frames.length){
                          for(i = 0; i < window.frames.length; i++){
                             if(window.frames[i].n_changed == undefined){
                                  window.frames[i].n_changed = true;
                                  var __originalNavigator = window.frames[i].navigator;
                                  window.frames[i].navigator = new Object();
                                  window.frames[i].navigator.__proto__ = __originalNavigator;
                                  window.frames[i].navigator.__defineGetter__('userAgent', function () { return myUserAgent; });
                                  window.frames[i].callPhantom = undefined;
                                  window.frames[i]._phantom = undefined;
                             }
                             //mLog(window.frames[i].navigator.userAgent);
                          }
                      }
                  }
              , true);
          }, myUserAgent, Sys.log);
          
          page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', function() { 
            
            /* GOOGLE RECAPTCHA V2 RECOGNITION MODULE */
          
            var Result = {};
            Result.gStSessionId = getRandomInt(1050, 1005050505);
            Result.gStSuccess = false;
            Result.pageLang = "en";
            Result.russianRequired = false;
            Result.gStResponse = "";
            Result.gStDescription = "";
            Result.gStImages = [];
            Result.gStImagesContent = [];
            Result.gStImageForRecognizing = "";
            Result.gStRecognized = "";
            Result.gStCandidate = {x: 0, y: 0, w: 0, h: 0, content: ""};
            Result.gStVerifyButton = {x: 0, y: 0};
            Result.gStreCapthcaToken = "";
            Result.loadingImagesFailures = 0;
            Result.gStEvents = {
                res: false,
                presscheck: false,
                presscheckcount: 0,
                renderingImages: false,
                recognitionStage: 0,
                recognizing: false,
                selecting: false,
                selectingStage: 0,
                selectingCount: 0,
                submiting: false,
                submitmoment: 0,
                submitted: false,
                fictiveselecting: false,
                fictiveselectingprev: -1,
                imagesLoadingStMoment: 0
            }
            Result.mouseX = 0;
            Result.mouseY = 0;
            Result.resourceIframeLoaded = false;
            Sys.mousemove(Result.mouseX, Result.mouseY);

            var start_t = Date.now();
            
            var main = setInterval(function() {
                if (Result.gStEvents.res == false) {
                    var ret = JSON.parse(page.evaluate(function(Result, mLog, getRandomInt) {
                        Result = JSON.parse(Result);

                        var iframe = jQuery(".g-recaptcha iframe");
                        
                        if (iframe.length) {
                            
                            if (iframe.get(0).contentDocument.readyState === "complete") {
                                var anchor = iframe.contents().find("#recaptcha-anchor");
                                
                                if(anchor.length){
                                    Result.resourceIframeLoaded = true;
                                }
                                
                                //mLog(anchor.attr("aria-checked"));
                                if (anchor.length && anchor.attr("aria-checked") == "true") {
                                    Result.gStSuccess = true;
                                    Result.gStResponse = jQuery('textarea[name=g-recaptcha-response]').val();
                                    Result.gStEvents.res = true;
                                }
                                else if (anchor.length) {
                                    if (Result.gStEvents.presscheckcount == 0) {
                                        var check = iframe.contents().find("#recaptcha-anchor .recaptcha-checkbox-checkmark");
                                        Result.check_x = check.offset().left + check.width() / 2 + iframe.offset().left;
                                        Result.check_y = check.offset().top + check.height() / 2 + iframe.offset().top;
                                        Result.gStEvents.presscheck = true;
                                    }
                                    else if (!Result.gStEvents.presscheck) {
                                        var capiframe = jQuery('iframe[src*="www.google.com/recaptch"]').last();
                                        if (capiframe.length &&
                                                capiframe.get(0).contentDocument.readyState === "complete" &&
                                                capiframe.contents().find('#rc-imageselect').length) {

                                            var token = capiframe.contents().find('#recaptcha-token').val();

                                            if (Result.gStreCapthcaToken != token && Date.now() - Result.gStEvents.submitmoment > 1.3 * 1000) {
                                                Result.gStEvents.submitted = false;

                                                if (Result.gStEvents.renderingImages != true && Result.gStEvents.recognitionStage == 0) {

                                                    var frameleft = capiframe.offset().left;
                                                    var frametop = capiframe.offset().top;
                                                    if (frametop < 0) {
                                                        mLog("Wrong position of google tiles iframe!");
                                                    }
                                                    else {
                                                        Result.gStImagesContent = [];
                                                        Result.gStImageForRecognizing = "";

                                                        var desc = capiframe.contents().find('#rc-imageselect .rc-imageselect-desc-no-canonical').html();
                                                        if (!desc) {
                                                            desc = capiframe.contents().find('#rc-imageselect .rc-imageselect-desc-wrapper .rc-imageselect-desc').html();

                                                            if (capiframe.contents().find('#rc-imageselect-candidate').length) {
                                                                Result.gStCandidate.x = capiframe.contents().find('#rc-imageselect-candidate').offset().left + frameleft;
                                                                Result.gStCandidate.y = capiframe.contents().find('#rc-imageselect-candidate').offset().top + frametop;
                                                                Result.gStCandidate.w = capiframe.contents().find('#rc-imageselect-candidate').width();
                                                                Result.gStCandidate.h = capiframe.contents().find('#rc-imageselect-candidate').height();
                                                            }
                                                        }
                                                        else {
                                                            Result.gStCandidate.x = 0;
                                                            Result.gStCandidate.y = 0;
                                                            Result.gStCandidate.w = 0;
                                                            Result.gStCandidate.h = 0;
                                                            Result.gStCandidate.content = "";
                                                        }

                                                        if (capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').length) {
                                                            Result.gStDescription = desc;
                                                            Result.gStImages = [];
                                                            capiframe.data('phjs-data-imgs-loaded', "0");
                                                            capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper img').removeClass("phjs-image-load");
                                                            Result.gStEvents.imagesLoadingStMoment = Date.now();
                                                            
                                                            for (i = 0; i < capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').length; i++) {

                                                                var item = {x: 0, y: 0, h: 0, w: 0};
                                                                item.x = capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').eq(i).offset().left + frameleft;
                                                                item.y = capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').eq(i).offset().top + frametop;
                                                                item.w = capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').eq(i).width();
                                                                item.h = capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper').eq(i).height();
                                                                Result.gStImages.push(item);

                                                            }
                                                            Result.gStEvents.renderingImages = true;

                                                        }
                                                        else {
                                                            mLog("Wrong content of google tiles iframe");
                                                            Result.gStEvents.res = true;
                                                        }
                                                    }
                                                }

                                                if (Result.gStEvents.recognizing == false && Result.gStEvents.recognitionStage == 1) {
                                                    //send image for recognition

                                                    mLog("Recognizing captcha ...");
                                                    Result.gStRecognized = "";
                                                    Result.gStEvents.recognizing = true;
                                                }

                                                if (Result.gStEvents.selecting == false && Result.gStEvents.recognitionStage == 2) {
                                                    //send image for recognition

                                                    mLog("Selecting captcha images ...");
                                                    Result.gStEvents.selecting = true;
                                                    Result.gStEvents.selectingStage = 0;
                                                }

                                                if (Result.gStEvents.submiting == false && Result.gStEvents.recognitionStage == 3) {
                                                    var frameleft = capiframe.offset().left;
                                                    var frametop = capiframe.offset().top;
                                                    if (frametop < 0) {
                                                        mLog("Wrong position of google tiles iframe!");
                                                    }
                                                    else {
                                                        Result.gStVerifyButton.x = capiframe.contents().find('#recaptcha-verify-button').offset().left + frameleft +
                                                                capiframe.contents().find('#recaptcha-verify-button').width() / 2;
                                                        Result.gStVerifyButton.y = capiframe.contents().find('#recaptcha-verify-button').offset().top + frametop +
                                                                capiframe.contents().find('#recaptcha-verify-button').height() / 2;

                                                        Result.gStEvents.submitted = false;
                                                        Result.gStEvents.submiting = true;
                                                        Result.gStreCapthcaToken = token;
                                                    }
                                                }
                                            }
                                            else if (Result.gStEvents.submitted == true && Date.now() - Result.gStEvents.submitmoment > 2 * 1000) {

                                                if (capiframe.contents().find('#rc-imageselect .rc-imageselect-error-select-one').is(':visible') || capiframe.contents().find('#rc-imageselect .rc-imageselect-error-select-more').is(':visible')) {
                                                    Result.gStEvents.submitted = false;

                                                    var old_recognized = Result.gStRecognized.split("");
                                                    var additionally = [];

                                                    var safe_count = 0;
                                                    while ((old_recognized.length + additionally.length < old_recognized.length + 1 || old_recognized.length + additionally.length < 3) && safe_count++ < 3000) {
                                                        var k = getRandomInt(1, Result.gStImages.length) - 1;
                                                        var found = false;
                                                        for (j = 0; j < old_recognized.length; j++)
                                                            if (old_recognized[j] == k) {
                                                                found = true;
                                                                break;
                                                            }

                                                        if (!found)
                                                            additionally.push(k);
                                                    }

                                                    if (additionally.length) {
                                                        Result.gStRecognized = additionally.join("");
                                                        Result.gStEvents.recognitionStage = 2;
                                                        Result.gStEvents.selecting = true;
                                                        Result.gStEvents.selectingStage = 0;
                                                        mLog("Selecting additionally: " + Result.gStRecognized);
                                                        Result.gStreCapthcaToken = "";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    mLog("Wrong content of google main iframe");
                                    Result.gStEvents.res = true;
                                }
                            };
                        }
                        else {
                            mLog("Cannot find google main iframe");
                            Result.gStEvents.res = true;
                        }

                        return JSON.stringify(Result);
                    }, JSON.stringify(Result), Sys.log, getRandomInt));

                    if (ret != null) {
                        Result = ret;
                        resourceIframeLoaded = Result.resourceIframeLoaded;
                    }
                    else
                        Sys.log("Result variable is null!!!");

                    if (Date.now() - start_t >= captchaRecognizingTimeout) {
                        Result.gStEvents.res = true;
                        clearInterval(main);
                    }
                }
                else {
                    clearInterval(main);
                }
            }, 1000);

            //events
            var evPressCheckMut = false;
            var evPressCheck = setInterval(function() {
                if (Result.gStEvents.presscheck && evPressCheckMut == false) {
                    evPressCheckMut = true;


                    var count = 0;
                    var internalI = setInterval(function() {
                        if (count >= 20) {
                            clearInterval(internalI);

                            Sys.movemousesmoothly(Result.check_x, Result.check_y, Result.mouseX, Result.mouseY);
                            Result.mouseX = Result.check_x;
                            Result.mouseY = Result.check_y;

                            Sys.click(Result.check_x, Result.check_y);

                            Sys.log("Click on reCaptcha!");

                            Result.gStEvents.presscheck = false;
                            Result.gStEvents.presscheckcount++;
                            evPressCheckMut = false;
                        }
                        else {
                            var x = getRandomInt(0, page.viewportSize.width - 1);
                            var y = getRandomInt(0, page.viewportSize.height - 1);
                            Sys.movemousesmoothly(x, y, Result.mouseX, Result.mouseY);
                            Result.mouseX = x;
                            Result.mouseY = y;
                        }

                        count++;

                    }, 300);
                }
            }, 50);

            var evRenderingImagesMut = false;
            var evRenderingImages = setInterval(function() {
                if (Result.gStEvents.renderingImages && evRenderingImagesMut == false) {
                    evRenderingImagesMut = true;
                    
                    var isImagesReady = page.evaluate(function(mLog){
                        var capiframe = jQuery('iframe[src*="www.google.com/recaptch"]').last();
                        var imgs = capiframe.contents().find('#rc-imageselect .rc-image-tile-wrapper img');
                        
                        for(i = 0; i < imgs.length; i++){
                            if(!imgs.eq(i).hasClass('phjs-image-load')){
                                var img = new Image();
                                img.onload = function() {
                                      capiframe.data('phjs-data-imgs-loaded', parseInt(capiframe.data('phjs-data-imgs-loaded')) + 1);
                                }
                                img.src = imgs.eq(i).attr('src');
                                imgs.eq(i).addClass('phjs-image-load');
                            }
                        }
                        
                        if(parseInt(capiframe.data('phjs-data-imgs-loaded')) > 7)
                            return true;
                        else
                            return false;
                        
                    }, Sys.log);
                    
                    if(!isImagesReady)
                        if(Date.now() - Result.gStEvents.imagesLoadingStMoment > 13*1000){
                            Result.gStEvents.renderingImages = false;
                            Result.gStEvents.recognitionStage = 2;
                            evRenderingImagesMut = false;
                            
                            Result.gStEvents.selectingStage = 0;
                            Result.gStRecognized = "";
                            Result.gStEvents.selecting = true;
                            Result.loadingImagesFailures++;
                            if(Result.loadingImagesFailures > 3){
                                Sys.log("Cannot load images for recognizing.");
                                Result.gStEvents.res = true;
                            }
                            else
                                Sys.log("Cannot load images. Jump to random selecting stage...");
                        }
                    
                    if(isImagesReady){
                        Result.gStImagesContent = [];
                        Result.gStImageForRecognizing = "";

                        var sessionId = Result.gStSessionId;
                        if (Result.gStImages.length) {
                            for (i in Result.gStImages) {
                                var item = Result.gStImages[i];
                                page.clipRect = {
                                    top: item.y,
                                    left: item.x,
                                    width: item.w,
                                    height: item.h
                                };
                                var data = page.renderBase64('PNG');
                                //.page.render("img/tile_" + sessionId + "_" + (parseInt(i) + 1) + ".jpg", {format: 'jpeg', quality: '81'});
                                Result.gStImagesContent.push(data);
                            }
                        }
                        else {
                            Sys.log("No images has been extracted!");
                            return;
                        }

                        if (Result.gStCandidate.x != 0) {
                            page.clipRect = {
                                top: Result.gStCandidate.y,
                                left: Result.gStCandidate.x,
                                width: Result.gStCandidate.w,
                                height: Result.gStCandidate.h
                            };
                            //page.render("img/candidate_" + sessionId +  ".jpg", {format: 'jpeg', quality: '81'});
                            var data = page.renderBase64('PNG');
                            Result.gStCandidate.content = data;
                        }
                        else {
                            Result.gStCandidate.content = "";
                        }

                        page.clipRect = {};

                        var desc = Result.gStDescription;
                        if (!desc) {
                            Sys.log("Description of the captcha is empty!");
                            return;
                        }
                        var descriptionTranslationEnded = false;
                        /* description translation */
                        var desc_en = "";
                        var desc_ru = "";
                        var lang = 'ru-en';
                        if (Result.pageLang == "en") {
                            lang = 'en-ru';
                            desc_en = desc;
                        }
                        else {
                            desc_ru = desc;
                        }

                        var desc_found = false;

                        var descs = JSON.parse(filesystem.read("descs.json"));
                        if (descs == null || descs == undefined || !descs.data) {
                            descs = {data: []};
                        }
                        if (descs.data.length) {
                            for (i in descs.data) {
                                var item = descs.data[i];
                                if (item.ru && item.ru == desc_ru) {
                                    desc_found = true;
                                    desc_en = item.en;
                                    break;
                                }
                                if (item.en && item.en == desc_en) {
                                    desc_found = true;
                                    desc_ru = item.ru;
                                    break;
                                }
                            }
                        }

                        if (!desc_found && (Result.russianRequired || (Result.russianRequired == false && lang == 'ru-en'))) {
                            var yandex_request = 'https://translate.yandex.net/api/v1.5/tr.json/translate?text=' + encodeURIComponent(desc) + '&key=' + yandexTranslatorAPIKey + '&lang=' + lang + '&format=html';
                            var myargs = commandLinePHPRun[1].concat(["GET", JSON.stringify({request: yandex_request, timeout: 10, yandex_translate: true})]);
                            execFile(commandLinePHPRun[0], myargs, null, function(err, stdout, stderr) {
                                if (!err) {
                                    if (Result.pageLang == "en") {
                                        desc_ru = stdout;
                                    }
                                    else {
                                        desc_en = stdout;
                                    }

                                    descs.data.push({ru: desc_ru, en: desc_en});
                                    if (descs.data.length > 1000)
                                        descs.data.shift();
                                    filesystem.write("descs.json", JSON.stringify(descs), 'w');
                                }
                                descriptionTranslationEnded = true;
                            });
                        } else {
                            descriptionTranslationEnded = true;
                        }
                        /* end description translation */

                        var internalIMut = false;
                        var internalI = setInterval(function() {
                            if (descriptionTranslationEnded && internalIMut == false) {
                                internalIMut = true;
                                var ppage = webPage.create();
                                ppage.viewportSize = {width: 590};
                                var content = filesystem.read("canvas.html");
                                ppage.setContent(content, "");

                                ppage.evaluate(function(mLog, images, candidate, desc_ru, desc_en, yandexTranslatorAPIKey, russianRequired) {
                                    images = JSON.parse(images);

                                    for (i in images) {
                                        jQuery('.imgs img').eq(i).attr('src', 'data:image/png;base64,' + images[i]);
                                    }
                                    if (images.length < 9) {
                                        for (i = images.length; i < 9; i++) {
                                            jQuery('.imgs .img').eq(i).remove();
                                        }
                                    }

                                    if (candidate != "") {
                                        jQuery('.candidate img').attr('src', 'data:image/png;base64,' + candidate);
                                    }
                                    else {
                                        jQuery('.candidate').remove();
                                    }

                                    if (desc_ru) {
                                        jQuery('.text > span').eq(1).html(desc_ru);
                                    }
                                    else {
                                        jQuery('.text > span').eq(1).remove();
                                    }

                                    if (desc_en) {
                                        jQuery('.text > span').first().html(desc_en);
                                    }
                                    else {
                                        jQuery('.text > span').first().remove();
                                    }

                                    if (russianRequired == false) {
                                        jQuery('.text > span').eq(1).remove();
                                        jQuery('span.example').eq(1).remove();
                                    }

                                }, Sys.log, JSON.stringify(Result.gStImagesContent), Result.gStCandidate.content, desc_ru, desc_en, yandexTranslatorAPIKey, Result.russianRequired);

                                setTimeout(function() {
                                    Result.gStImageForRecognizing = 'img/google_captcha_' + Result.gStSessionId + '_' + (getRandomInt(1, 4000000000)) + '.jpg';
                                    ppage.render(Result.gStImageForRecognizing, {format: 'jpeg', quality: '85'});

                                    //Result.gStImageForRecognizing = ppage.renderBase64('PNG');
                                    Sys.log("Captcha image has been saved!");
                                    Result.gStEvents.renderingImages = false;
                                    Result.gStEvents.recognitionStage++;
                                    evRenderingImagesMut = false;
                                }, 1300);

                                descriptionTranslationEnded = false;
                                internalIMut = false;
                                clearInterval(internalI);
                            }
                        }, 50);
                    }
                    else{
                        evRenderingImagesMut = false;
                    }
                }
            }, 1000);

            var evSelectingMut = false;
            var evRecognizingMut = false;
            var evRecognizing = setInterval(function() {
                if (Result.gStEvents.recognizing && evRecognizingMut == false) {
                    evRecognizingMut = true;

                    var queryCompleted = false;
                    //var inp = Sys.consoleRead(); queryCompleted = true;
                    var inp = "";

                    Result.gStEvents.selectingStage = 0;
                    Result.gStEvents.fictiveselecting = true;

                    var myargs = commandLinePHPRun[1].concat(["ANTIGATE", JSON.stringify({timeoutForRecognizing: 60, imagePath: Result.gStImageForRecognizing, googleCaptcha: true})]);

                    execFile(commandLinePHPRun[0], myargs, null, function(err, stdout, stderr) {
                        if (!err) {
                            if (stdout.indexOf("CAPTCHAOK:") != -1) {
                                var res = stdout.replace(/CAPTCHAOK:/, "");
                                Sys.log("Recognized result: " + res);
                                inp = res;
                            }
                        }

                        var internalIMut = setInterval(function() {
                            if (evSelectingMut == false) {
                                queryCompleted = true;
                                Result.gStEvents.selectingStage = 0;
                                Result.gStEvents.fictiveselecting = false;
                                clearInterval(internalIMut);
                            }
                        }, 1);
                    });


                    var internalIMut = false;
                    var internalI = setInterval(function() {
                        if (queryCompleted && internalIMut == false) {
                            internalIMut = true;

                            Result.gStRecognized = inp;
                            Result.gStEvents.recognizing = false;
                            Result.gStEvents.recognitionStage++;
                            evRecognizingMut = false;

                            queryCompleted = false;
                            internalIMut = false;
                            clearInterval(internalI);
                        }
                    }, 50);
                }
            }, 50);


            var evSelecting = setInterval(function() {
                if ((Result.gStEvents.selecting || Result.gStEvents.fictiveselecting) && evSelectingMut == false) {
                    evSelectingMut = true;

                    if (Result.gStEvents.selectingStage == 0) {
                        Result.gStEvents.selectedItems = [];
                        Result.gStEvents.selectedIndex = 0;

                        if (Result.gStEvents.fictiveselecting) {
                            Result.gStEvents.fictiveselectingprev = -1;
                        }

                        if (Result.gStRecognized.length == 0 || Result.gStEvents.fictiveselecting) {

                            Result.gStEvents.selectingCount = Result.gStEvents.fictiveselecting ? getRandomInt(7, 9) : getRandomInt(3, 4);

                            while (Result.gStEvents.selectedItems.length != Result.gStEvents.selectingCount) {
                                var k = getRandomInt(1, Result.gStImages.length) - 1;
                                var found = false;
                                for (j = 0; j < Result.gStEvents.selectedItems.length; j++)
                                    if (Result.gStEvents.selectedItems[j] == k) {
                                        found = true;
                                        break;
                                    }
                                if (!found)
                                    Result.gStEvents.selectedItems.push(k);
                            }
                        }
                        else {
                            Result.gStRecognized = Result.gStRecognized.substr(0, 4);
                            Result.gStEvents.selectingCount = Result.gStRecognized.length;
                            var rec = Result.gStRecognized.split("");
                            for (i in rec) {
                                var k = parseInt(rec[i]) - 1;
                                if (k < 0)
                                    k = 0;
                                Result.gStEvents.selectedItems.push(k);
                            }
                        }
                    }

                    var step = 13;
                    if (Result.gStEvents.ficitveselecting) {
                        step = 85;
                    }
                    if (Result.gStEvents.selectingStage % step == 0) {
                        var i = Result.gStEvents.selectedItems[Result.gStEvents.selectedIndex];

                        if (Result.gStEvents.fictiveselecting) {
                            i = getRandomInt(0, Result.gStEvents.selectingCount);
                        }

                        if (Result.gStEvents.fictiveselectingprev != -1) {
                            var data = Result.gStImages[Result.gStEvents.fictiveselectingprev];
                            var x = data.x + data.w / 2;
                            var y = data.y + data.h / 2;

                            Sys.movemousesmoothly(x, y, Result.mouseX, Result.mouseY);
                            Result.mouseX = x;
                            Result.mouseY = y;
                            Sys.click(x, y);
                            if (Result.gStEvents.fictiveselecting == false) {
                                Result.gStEvents.fictiveselectingprev = -1;
                            }
                        }

                        if (Result.gStEvents.fictiveselecting) {
                            Result.gStEvents.fictiveselectingprev = i;
                        }

                        var data = Result.gStImages[i];
                        var x = data.x + data.w / 2;
                        var y = data.y + data.h / 2;

                        Sys.movemousesmoothly(x, y, Result.mouseX, Result.mouseY);

                        Result.mouseX = x;
                        Result.mouseY = y;
                        Sys.click(x, y);

                        if (Result.gStEvents.fictiveselecting == false)
                            Result.gStEvents.selectedIndex++;
                        else {

                        }
                    }

                    if (Result.gStEvents.selectedIndex == Result.gStEvents.selectingCount) {
                        Result.gStEvents.selecting = false;
                        Result.gStEvents.selectingStage = 0;
                        Result.gStEvents.recognitionStage++;
                    }
                    Result.gStEvents.selectingStage++;
                    evSelectingMut = false;
                }
            }, 50);

            var evSubmitingMut = false;
            var evSubmiting = setInterval(function() {
                if (Result.gStEvents.submiting && evSubmitingMut == false) {
                    evSubmitingMut = true;

                    Sys.movemousesmoothly(Result.gStVerifyButton.x, Result.gStVerifyButton.y, Result.mouseX, Result.mouseY);
                    Result.mouseX = Result.gStVerifyButton.x;
                    Result.mouseY = Result.gStVerifyButton.y;
                    Sys.click(Result.gStVerifyButton.x, Result.gStVerifyButton.y);

                    Sys.log("Submiting...");

                    //page.render("test_submit.jpg", {format: 'jpeg', quality: '85'}); 

                    Result.gStEvents.submiting = false;
                    Result.gStEvents.submitted = true;
                    Result.gStEvents.submitmoment = Date.now();
                    Result.gStEvents.recognitionStage = 0;
                    evSubmitingMut = false;
                }
            }, 50);

            //tracking end of perfoming
            var trackingEnd = setInterval(function() {
                if (Result.gStEvents.res) {
                    if (!Result.gStSuccess) {
                        Sys.log("Fail in recognizing google recaptcha!");
                    }
                    else {
                        Sys.log("Captcha has been recognized for " + (parseInt((Date.now() - start_t) / 1000)) + " seconds!");
                        Sys.log("Captcha result:|**|" + Result.gStResponse + "|**|");
                    }
                   
                    clearInterval(main);
                    clearInterval(evPressCheck);
                    clearInterval(evRenderingImages);
                    clearInterval(evRecognizing);
                    clearInterval(evSelecting);
                    clearInterval(evSubmiting);
                    clearInterval(trackingEnd);
                    phantom.exit();
                }
            }, 30);

            /* END GOOGLE RECAPTCHA RECOGNITION MODULE */

        });
    }
    else if (!firstPageLoading) {
        Sys.log("error in page loading!");
        phantom.exit();
    }
};

var pageContent = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>TITLE</title></head><body style="background-color: #fff"><form><div class="g-recaptcha" data-sitekey="' + siteKeyParam + '">\
        </div><script src="https://www.google.com/recaptcha/api.js?hl=en"></script></form></body></html>';

firstPageLoading = true;
page.open('http://nocaptcha.ultra-cms.ru/', function(){
    setTimeout(function(){
        firstPageLoading = false;
        page.setContent(pageContent, siteUrlParam);
    }, 1000);
});

//page.setContent(pageContent, siteUrlParam);
//page.open(siteUrlParam);

setTimeout(function(){
    Sys.log("Forced timeout, ending script!")
    phantom.exit();
}, performTimeout);

var resourceIframeStart = Date.now();
var resourceIframeTracking = setInterval(function(){
    if(resourceIframeLoaded){
        clearInterval(resourceIframeTracking);
    }
    else if(Date.now() - resourceIframeStart > captchaResourceTimeout){
       
        phantom.exit();
    }
}, 50)

/* HELPERS */

var Sys = function() {
    
}

Sys.log = function(msg){
   msg = "PHJS: " + msg;
   console.log(msg);
}

Sys.mousemove = function(x, y){
   
   page.sendEvent('mousemove', x, y);
}

Sys.movemousesmoothly = function(tox, toy, fromx, fromy) {
    //moving mouse
    
    var x1 = fromx;
    var y1 = fromy;
    var x2 = tox;
    var y2 = toy;
    var stepX = parseInt((x2 - x1) / 77);
    var stepY = parseInt((y2 - y1) / 77);
    if (stepX > 0 || stepY > 0){
        Sys.mousemove(fromx, fromy);
        while ((Math.abs(x2 - x1) > 2 * Math.abs(stepX) && stepX != 0) && (Math.abs(y2 - y1) > 2 * Math.abs(stepX) && stepY != 0)) {
            x1 += stepX * (getRandomInt(50, 100) / 100);
            y1 += stepY * (getRandomInt(50, 100) / 100);
            
            Sys.mousemove(parseInt(x1), parseInt(y1));
        }
    }
    Sys.mousemove(tox, toy);
    //end moving mouse
}

Sys.click = function(x, y){
    page.sendEvent('mousedown', x, y);
    page.sendEvent('mouseup', x, y);
    //page.sendEvent('click', x, y);
}

Sys.wait_for = function(callback){
    do{
        page.sendEvent('mousemove');
    }while(!callback());
}

Sys.wait = function(interval){
    var t = Date.now();
    do{
       page.sendEvent('mousemove');
    }while(Date.now() - t < interval);
}

Sys.type = function(symbols, clear, interval){
    if(clear){
        clear = parseInt(clear);
        for(i = 0; i < clear; i++){
           page.sendEvent('keypress', page.event.key.Backspace); 
        }
    }
    
    symbols = symbols.split("");
    if(symbols.length){
        for(i in symbols){
            page.sendEvent('keypress', symbols[i]);
            if(interval){
                Sys.wait(interval);
            }
        }
    }
}

Sys.consoleRead = function() {
    var system = require('system');

    system.stdout.writeLine(' : ');
    var line = system.stdin.readLine();

    return line;
}

Sys.prototype = {}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
} 

