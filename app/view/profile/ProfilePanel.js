/**
 * @class Showtime.views.ProfilePanel
 * @extends Ext.Panel
 * 
 */
/*global Ext,Showtime*/
Ext.define('Showtime.view.profile.ProfilePanel', {
    extend: 'Ext.Panel',
    id: 'profile-panel',
    requires:['Showtime.view.profile.Toolbar', 'Showtime.view.profile.BottomToolbar'],
    config:{
        alias:'profile-panel',
        layout: 'fit',
        masked: {
            xtype: 'loadmask',
            message: 'Loading'
        }
    },
    initialize:function () {
        this.callParent();

        profilepanel = this;

        //Toolbars:
        if (!this.tbar) {
            this.tbar = Ext.create('Showtime.view.profile.Toolbar', {
                title: 'LCF Showtime',
                config: {
                    docked: 'top'
                }
            });
        }
        //add the toolbar to the panel's docked items
        this.add(this.tbar);

        this.bottomToolbar = Ext.create('Showtime.view.profile.BottomToolbar');
        //add the toolbar to the panel's docked items
        this.add(this.bottomToolbar);


        this.on('remove', function (profilepanel) {
            if (profilepanel.player) {
                profilepanel.player.destroy()
            }
            if (profilepanel.overlay) {
                profilepanel.overlay.destroy()
            }
        });
        this.on('deactivate', function (profilepanel) {
            //destroy the carousel
            if (profilepanel.profileCarousel) {
                profilepanel.profileCarousel.removeAll(true, true);
                profilepanel.profileCarousel.destroy();
            }
            if (profilepanel.descriptionPanel) {
                profilepanel.descriptionPanel.destroy();
            }
            if (profilepanel.player) {
                profilepanel.player.removeAll(true, true);
                profilepanel.player.destroy()
            }
            if (profilepanel.overlay) {
                profilepanel.overlay.removeAll(true, true);
                profilepanel.overlay.destroy()
            }
            if (profilepanel.tbar) {
                profilepanel.remove(profilepanel.tbar)
            }
            if (profilepanel.bottomToolbar) {
                profilepanel.remove(profilepanel.bottomToolbar)
            }
        });
    },

    //load a profile
    loadProfile:function (result, listData) {
        this.tbar.setTitle(result.Student.firstName + ' ' + result.Student.lastName);
        this.bottomToolbar.setTitle('temp title');

        if (this.profileCarousel) {
            this.profileCarousel.removeAll(true, true);
            this.profileCarousel.destroy();
        }
        var media_cards = this.createCards(result);
        this.profileCarousel = Ext.create('Ext.Carousel', {
            layout: 'fit',
            id:'profile-carousel',
            itemId:'carousel',
            listeners:{
                tap: function (target) {
                    //if tapping on the video image, then play in an overlay
                    if (Ext.get(target).parent().dom.className.indexOf('video') != -1) { //seems to be necessary to search the actual dom classname, using ext.element.is only works first time round :(
                        if (!this.player) {
                            this.player = Ext.create('Ext.Panel', {
                                id:'player'
                            });
                        }

                        // Create the player overlay wrapper
                        if (!this.overlay) {
                            this.overlay = Ext.create('Ext.Panel', {
                                id:'vidOverlay',
                                //floating:true,
                                modal:true,
                                hideOnMaskTap: true,
                                centered:true,
                                width:650,
                                height:395,
                                listeners:{
                                    beforehide:{
                                        fn:function (evt) {
                                            this.player.setHtml('');
                                        }
                                    }
                                }
                            });
                            this.overlay.add(this.player);
                            this.add(this.overlay);
                        }

                        this.overlay.show();

                        parentElement = Ext.get(target).parent();
                        if (Ext.get(target).parent().dom.className.indexOf('vimeo') != -1) {
                            this.player.setHtml('<iframe class="vimeo-player" type="text/html" width="640" height="385" src="http://player.vimeo.com/video/'+parentElement.id.substr(3)+'?byline=0&amp;portrait=0&amp;color=ffffff" frameborder="0"></iframe>');
                        }
                        else {
                            this.player.setHtml('<iframe class="youtube-player" type="text/html" width="640" height="385" src="http://www.youtube.com/embed/'+parentElement.id.substr(3)+'" frameborder="0"></iframe>');
                        }
                    } else {
                        var toolbar = Ext.ComponentQuery.query('#profile-toolbar')[0];
                        var bottomToolbar = Ext.ComponentQuery.query('#bottom-toolbar')[0];
                        if (toolbar.isHidden()){
                            toolbar.show();
                            bottomToolbar.show();
                        } else {
                            toolbar.hide();
                            bottomToolbar.hide();
                        }
                    }
                },
                activeitemchange:function (container, newCard, oldCard, opts) {
                    var mediaData = Ext.ComponentQuery.query('#'+newCard.getId())[0].getData();
                    var bottomToolbar = Ext.ComponentQuery.query('#bottom-toolbar')[0];
                    if (bottomToolbar) {
                        bottomToolbar.setTitle(mediaData.title);
                        bottomToolbar.data = mediaData;
                    }
                },
                deactivate: function () {
                    this.removeAll(true);
                }
            }
        });

        var me = this.profileCarousel;
        me.element.on ({
            tap: function (event, target) {
                me.fireEvent ('tap', target);
            }
        });

        //using add rather than setting items so we can fire event for each card
        this.profileCarousel.add(media_cards);

        //add the carousel
        this.add(this.profileCarousel);

        //create an instance of the student model (used by form)
        //TODO reinstate
        this.student = Ext.create('Showtime.model.StudentModel', {
            'firstname':result.Student.firstName,
            'lastname':result.Student.lastName,
            'profileurl':result.Student.profileurl,
            'shorturl':result.Student.shorturl
        });

        //quick hack - place the course name in the result data - because at present only course id is available in json
        result.Student['course'] = listData.course;

        this.studentdata = result.Student;
        this.profileCarousel.show();
        this.show();
        this.setMasked(false);

        //bottomToolbar seems to like to be shown only after profilepanel has been shown
        //this.bottomToolbar.show();
    },

    createCards:function (result) {
        var video_cards = [];
        var image_cards = [];
        var media_cards = [];

        //create a component containing the media item and panel sheet for the title/like button
        //each component is a 'card' in the carousel and the collection of components is added to the carousel's item property
        Ext.each(result.Media, function (media, i) {

            //only process video and images (publications ignored)
            if (media.video || media.touch || media.profile) {

                //create component to hold media
                var mediaCmp = Ext.create('Ext.Component', {
                    cls: 'profile-media-component',
                    tpl:new Ext.XTemplate(
                        '{[this.renderMedia(values)]}',
                        {
                            renderMedia:function (media) {
                                if (media.video) {
                                    if (media.video_host == 'vimeo') {
                                        Ext.data.JsonP.request({
                                            url:'http://www.vimeo.com/api/v2/video/' + media.video_id + '.json',
                                            params:{
                                                callback:'Ext.util.JSONP.callback'
                                            },
                                            callback:function (success, response) {
                                                if (success) {
                                                    Ext.DomHelper.append('vm_' + media.video_id, {tag:'img', id:'vimeo_' + media.video_id, src:response[0].thumbnail_large});
                                                } else {
                                                    //failed
                                                }
                                            }
                                        });
                                        return '<div id="vm_' + media.video_id + '" class="video vimeo"><div class="play"></div></div>';
                                    } else {
                                        return '<div id="yt_' + media.video_id + '" class="video youtube"><div class="play"></div><img class="video-img" src="http://img.youtube.com/vi/' + media.video_id + '/0.jpg" /></div>';
                                    }
                                } else {
                                    if (media.touch) {
                                        return '<div class="profileimage size-touch" style="background-image:url(' + media.touch + ');background-repeat:no-repeat;"></div>';
                                    } else if (media.screen) {
                                        return '<div class="profileimage size-touch" style="background-image:url(' + media.screen + ');background-repeat:no-repeat;"></div>';
                                    }
                                    else if (media.profile) {
                                        return '<div class="profileimage size-profile" style="background-image:url(' + media.profile + ');background-repeat:no-repeat;"></div>';
                                    }
                                }
                            }
                        }
                    ),
                    data:media
                });

                //the carousel card that holds the media/sheet
                var card = Ext.create('Ext.Panel', {
                    data: media,
                    id: 'mediaCard_'+i,
                    items: mediaCmp,
                    layout:'fit'
                });

                //separate cards into video or image stacks
                if (media.video) {
                    video_cards.push(card);
                } else {
                    image_cards.push(card);
                }

            }
        });
        //join video and image cards together (video first seems to prevent crashing)
        media_cards = video_cards.concat(image_cards);
        return media_cards;
    },

    /*
     *
     * http://stackoverflow.com/a/3890175/617986
     * http://www.codinghorror.com/blog/2008/10/the-problem-with-urls.html
     * http://www.regular-expressions.info/email.html
     */
    linkify: function (inputText) {
        var replacedText, replacePattern1, replacePattern2, replacePattern3;

        //remove br's
        replacedText = inputText.replace(/<br[^>]*>/gm, '');

        //URLs starting with http:// or https://
        replacePattern1 = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = replacedText.replace(replacePattern1, '<a href="$1" rel="external">$1</a>');

        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        replacePattern2 =  /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" rel="external">$2</a>');

        //Change email addresses to mailto:: links.
        //replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
        replacePattern3 = /(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})\b/gim;
        replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1" rel="external">$1</a>');

        //add br's back in
        replacedText = replacedText.replace(/\n/g, '<br />');

        return replacedText
    },

    showDesc:function (button) {
        if (!this.descriptionPanel) {
            //turn urls into links (phonegap only - webapp is for exhibition use so we dont want people to leave the app):
            if (typeof window.plugins !== "undefined" && window.plugins.childBrowser !== "undefined") {
                linkifiedDescription = this.linkify(this.studentdata.description);
            } else {
                linkifiedDescription = this.studentdata.description;
            }

            //setup description panel
            this.descriptionPanel = new Ext.Panel({
                id:'description',
                tpl:new Ext.XTemplate('<div id="description"><h4>{firstName} {lastName}</h4><h5>{course}</h5><p>{[linkifiedDescription]}</p></div>'),
                data:this.studentdata,
                centered: true,
                modal:true,
                hideOnMaskTap: true,
                height:450,
                width:420,
                styleHtmlContent:true,
                scrollable: {
                    direction: 'vertical'
                }
            });
        }

        //add childbrowser links (phonegap app only)
        if (typeof window.plugins !== "undefined" && window.plugins.childBrowser !== "undefined") {
            Ext.get('description').on({
                delegate: 'a',
                click: function(e, t) {
                    //bypass childbrowser for email links
                    if (t.getAttribute('href').indexOf("mailto") == -1) {
                        e.stopEvent(true);
                        console.log('using childbrowser');
                        window.plugins.childBrowser.showWebPage(t.getAttribute('href'));
                    }
                }
            });
        }

        this.descriptionPanel.showBy(button);
    }
 });