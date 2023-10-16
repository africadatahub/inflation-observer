import React, { useEffect } from "react";
import { Modal } from 'bootstrap'

const SocialMedia = () => {

    const embeddedCode = () => {
        var url = window.location.href;
        var div = document.createElement('textarea');
        var iframe = `<iframe width="700" height="400" src="${url}" frameBorder="0"></iframe>`;
        div.innerHTML = iframe;
        var element = document.getElementById('iframe1');
        iframe.src = url

        if (!element.hasChildNodes()) {
            // It has at least one
            element.appendChild(div);
        }

        var myModal = new Modal(document.getElementById('exampleModal1'), {
            keyboard: false
        });
        myModal.show();
    }


    useEffect(() => {
        // Get all share buttons
        const shareButtons = document.querySelectorAll('.share-button');

        // Add click event listener to each button
        shareButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the URL of the current page
                const url = window.location.href;

                // Get the social media platform from the button's class name
                const platform = button.classList[1];

                // Set the URL to share based on the social media platform
                let shareUrl;
                switch (platform) {
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/share?url=${encodeURIComponent(url)}`;
                        break;
                    case 'whatsapp':
                        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
                        break;
                }

                // Open a new window to share the URL
                window.open(shareUrl, '_blank');
            });
        });
    }, [])
    return (
        <div className="container share--socials">
            <div className="row">
                <div className="col">
                    <div className="share-buttons">
                        <button className="share-button facebook">
                            <i className="fab fa-facebook-f"></i>
                        </button>
                        <button className="share-button twitter">
                            <i className="fab fa-twitter"></i>
                        </button>
                        <button className="share-button whatsapp">
                            <i className="fab fa-whatsapp"></i>
                        </button>
                        <button className="btn-embed" onClick={(e) => { e.preventDefault(); embeddedCode() }}>
                            Embed
                        </button>
                    </div>
                </div>
                <div className="col">
                    <div className="modal fade " id="exampleModal1" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="exampleModalLabel">Embed Code</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body" id="modal-body">
                                    <div id="iframe1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default SocialMedia;