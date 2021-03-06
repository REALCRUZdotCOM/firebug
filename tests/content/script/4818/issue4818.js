function runTest()
{
    FBTest.sysout("issue4818.START");

    FBTest.openNewTab(basePath + "script/4818/issue4818.html", function(win)
    {
        FBTest.selectPanel("script");
        FBTest.enableScriptPanel(function(win)
        {
            var chrome = FW.Firebug.chrome;
            FBTest.waitForBreakInDebugger(null, "20", false, function()
            {
                FBTest.addWatchExpression(null, "v1", function(valueCol)
                {
                    FBTest.compare("ReferenceError: v1 is not defined",
                        valueCol.textContent,
                        "Verify the watch panel value");

                    FBTest.addWatchExpression(null, "v2", function(valueCol)
                    {
                        FBTest.compare("\"value2\"", valueCol.textContent,
                            "Verify the watch panel value");

                        var doc = chrome.window.document;
                        var panelStatus = doc.getElementById("fbPanelStatus");

                        var buttons = panelStatus.querySelectorAll("toolbarbutton");
                        FBTest.compare(3, buttons.length, "There must be three stack frames");

                        buttons[1].doCommand();

                        var value1 = FBTest.getWatchExpressionValue(chrome, "v1");
                        FBTest.compare("\"value1\"", value1, "Verify watch panel values");

                        var value2 = FBTest.getWatchExpressionValue(chrome, "v2");
                        FBTest.compare("ReferenceError: v2 is not defined", value2,
                            "Verify watch panel values");

                        FBTest.clickContinueButton();

                        FBTest.testDone("issue4818.DONE");
                    });
                });
            });

            FBTest.click(win.document.getElementById("testButton"));
        });
    });
}
