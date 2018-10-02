import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.io.File;
import java.nio.file.Files;
import static java.nio.file.StandardCopyOption.*;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;

//Test of the eu_002 pdf file, it will go through various user scenarios to test the functionality of the regex
// implementation (spanning pages, multiple search results, inclusive and non-inclusive, and overlap)
// @author SM modified: 4/28/18

public class TestEU_002 {
    private static WebDriver driver;
    private static String Tabula_url = "http://127.0.0.1:9292/";
    private WebDriverWait wait = new WebDriverWait(driver, 500);

    //will continue to refresh the page until it sees one of the buttons appear inthe menu option of the extraction page
    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    //will navigate and wait for the data to appear in the preview and export data page
    private void PreviewandExportDatapg(){
        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id));
        previewandexport_button.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("detection-row")));
    }
    //will wait for the regex button to become clickable and then click the regex button
    private void ClickRegexButton() throws InterruptedException {
        By regex_search_id = By.id("regex-search");
        WebElement regex_button = new WebDriverWait(driver, 30).until(ExpectedConditions.elementToBeClickable(regex_search_id));
        regex_button.click();
        Thread.sleep(800);
    }
    //send regex inputs to the corresponding pattern type
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);
    }
    //send corresponding info of inclusive to the pattern type
    private void InclusiveButtons(boolean patternbefore, boolean patternafter){
        WebElement inclusive_before_btn = new WebDriverWait(driver, 30).
                until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_before"))));
        WebElement inclusive_after_btn = new WebDriverWait(driver, 30).
                until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_after"))));
        if (patternbefore){
            inclusive_before_btn.click();
        }

        if(patternafter){
            inclusive_after_btn.click();
        }
    }
    //go on and upload the pdf file
    private void UploadPDF() throws InterruptedException {
        String filePath = System.getProperty("user.dir") + "/test/pdf/eu-002.pdf";
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(5000);
        wait.until(ExpectedConditions.elementToBeClickable(By.id("restore-detected-tables")));
    }
    //delete the pdf file
    private void DeletePDF(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
    }
    //instantiation of Tabula
    @BeforeClass
    public static void SetUp(){
        try{
            Files.move(new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }


        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();

    }
    //test for 2 different cases of only filling one of the regex inputs and checking that it didn't enable the regex button
    @Test
    public void TestHalfRegexInputsforPatternBeforeandPatternAfter(){
        try {
            UploadPDF();
            PageRefresh();

            //Test that checks that the regex search button is disabled after entering "Table 5" in pattern_before and
            // clicking the regex search button
            By pattern_before_input = By.id("pattern_before");
            driver.findElement(pattern_before_input).sendKeys("Chart 4");
            By regex_search_id = By.id("regex-search");
            Thread.sleep(600);
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id).isEnabled());
            driver.findElement(pattern_before_input).clear();
            driver.navigate().refresh();
            PageRefresh();

            //Test that checks that the regex search button is disabled after entering "Table 6" in pattern_after and
            // clicking the regex search button
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_after_input).sendKeys("Chart 5");
            By regex_search_id2 = By.id("regex-search");
            Thread.sleep(600);
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id2).isEnabled());
            driver.findElement(pattern_after_input).clear();

            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();

        } catch (Exception e) {
            System.out.print(e);
        }
    }
    //Test of 3 different instances of either one of the inputs being wrong or both of the inputs being wrong and
    // checking that it gave a regex result of zero
    @Test
    public void TestWrongInputsforBeforePatternandAfterPattern(){
        try{
            UploadPDF();
            PageRefresh();
            //Test that inputs an incorrect input for pattern before and incorrect input for pattern after
            PatternInputStrings("ksgjlk", "fgfsgs");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result;
            if(result.equals("0")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, Tabula found a match for incorrect inputs for pattern before and pattern after",
                    regex_result);
            driver.navigate().refresh();
            PageRefresh();

            //Test inputs correct input for pattern after and incorrect input for pattern before
            PatternInputStrings("jflaksl","Table 6" );
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result2;
            if(result2.equals("0")){ regex_result2 = true;} //if true, there are zero matches
            else{ regex_result2 = false;}
            assertTrue("Failed, Tabula found a match for a correct input for pattern after and incorrect input for " +
                    "pattern before", regex_result2);
            driver.navigate().refresh();
            PageRefresh();

            //Test inputs incorrect input for pattern after and correct input for pattern before
            PatternInputStrings("Table 5","glslkgf");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result3;
            if(result3.equals("0")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            assertTrue("Failed, Tabula found a match for incorrect input for pattern after and correct input for" +
                    " pattern before", regex_result3);

            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }
        catch(Exception e){
            System.out.print(e);
        }
    }
    //test of 3 different instances of inputting the same word for both regex inputs for one or the other or for both inputs
    @Test
    public void TestCommonWordInputforPatternBeforeandPatternAfter(){
        try{
            UploadPDF();
            PageRefresh();

            //Tests pattern before and pattern after with a common input found in the pdf
            PatternInputStrings("Impacts", "Impacts");
            ClickRegexButton();
            Thread.sleep(1000);
            PageRefresh();
            //confirmation of data picked and number of results from the regex results table in the extraction page
            Thread.sleep(600);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]"))
                    .getText();
            Boolean regex_data;
            if(result_data.equals("Knowledge and awareness of different cultures")){ regex_data = true;}
            else{ regex_data = false;}
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("Self competence")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input found in the pdf for both " +
                            "pattern before and pattern after",
                    final_results);
            driver.navigate().back();
            Thread.sleep(500);

            driver.navigate().refresh();
            PageRefresh();

            //Tests pattern before with a common input found in the pdf and pattern after with a correct input
            PatternInputStrings("Impacts", "Impacts on participating teachers");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result2;
            if(result2.equals("1")){ regex_result2 = true;}
            else{ regex_result2 = false;}
            PreviewandExportDatapg();
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("Knowledge and awareness of different cultures")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            Thread.sleep(600);
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("Self competence")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result2 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input for pattern before and " +
                    "correct input for pattern after", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests pattern before with a correct input and pattern after with a common input found in the pdf
            PatternInputStrings("Impacts on participating pupils","Impacts");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result3.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("Knowledge and awareness of different cultures")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            Thread.sleep(600);
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data6;
            if(result_data6.equals("Self competence")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result3 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input for pattern after and " +
                    "correct input for pattern after", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch(Exception e){
            System.out.print(e);
        }
    }
    //test of 3 different instances for including inclusiveness for one or the other or for both inputs
    @Test
    public void TestInclusiveInputsforPatternBeforeandPatternAfter() {
        try{
            UploadPDF();
            PageRefresh();

            //Tests for inclusive for pattern before and non-inclusive for pattern after
            PatternInputStrings("European/International","International");
            InclusiveButtons(true, false);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'European/International')]")).getText();
            Boolean regex_data;
            if(result_data.equals("European/International dimension of the")){ regex_data = true;}
            else{ regex_data = false;}
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'day')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("day school-life")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern before and non-inclusive for " +
                    "pattern after", final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for non-inclusive for pattern before and inclusive for pattern after
            PatternInputStrings("European/International", "International");
            InclusiveButtons(false, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result2.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'school')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("school")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            Thread.sleep(600);
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'International')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("International mobility of pupils")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result3 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and non-inclusive for " +
                    "pattern before", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for inclusive for pattern before and for pattern after
            PatternInputStrings("European/International","Training");
            InclusiveButtons(true, true);
            Thread.sleep(500);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result4;
            if(result3.equals("1")){ regex_result4 = true;} //if true, there are zero matches
            else{ regex_result4 = false;}
            PreviewandExportDatapg();
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'European/International')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("European/International dimension of the")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            Thread.sleep(600);
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Training')]"))
                    .getText();
            Boolean regex_data6;
            if(result_data6.equals("Training of teachers")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result4 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and inclusive for " +
                    "pattern before", final_results3);
            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch(Exception e){
            System.out.print(e);
        }
    }
    //test of 3 instances where one or the other or both instances are inputted a correct input but with the wrong or
    // right cause sensitivity
    @Test
    public void TestCaseSensitivity(){
        try {
            UploadPDF();
            PageRefresh();

            //Test case sensitive input for pattern before and correct input for pattern after
            PatternInputStrings("knowledge and awareness", "Self competence");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            //check that there is 0 results in the regex table
            Boolean regex_result;
            if (result.equals("0")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern before",
                    regex_result);
            driver.navigate().refresh();
            PageRefresh();

            //Test case sensitive input for pattern after and correct input for pattern before
            PatternInputStrings("Knowledge and awareness", "self competence");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));

            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            //check that there is 0 results in the regex table
            Boolean regex_result2;
            if (result2.equals("0")) {
                regex_result2 = true;
            } //if true, there are zero matches
            else {
                regex_result2 = false;
            }
            assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern after",
                    regex_result2);
            driver.navigate().refresh();
            PageRefresh();

            //Test case sensitive input for both pattern before and pattern after
            PatternInputStrings("knowledge and awareness", "self competence");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            //check that there is 0 results in the regex table
            Boolean regex_result3;
            if (result3.equals("0")) {
                regex_result3 = true;
            } //if true, there are zero matches
            else {
                regex_result3 = false;
            }
            assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern after and pattern before",
                    regex_result3);
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch(Exception e){
            System.out.print(e);
        }
    }
    //test of getting the text based image to display it's data in a linear form
    @Test
    public void TestTextBasedImage(){
        try {
            UploadPDF();
            PageRefresh();

            //Test to get only the text-based image to appear in the preview and export data page
            PatternInputStrings("satisfied", "Question");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));

            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) { regex_result = true; } //if true, there are zero matches
            else { regex_result = false; }
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Total')]")).getText();
            Boolean regex_data;
            if (result_data.equals("Total")) { regex_data = true; }
            else { regex_data = false; }
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'EU-25/EFTA: Middle')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("EU-25/EFTA: Middle (AT, BE, DE, LI, LU, NL)")) {
                regex_data2 = true; }
            else { regex_data2 = false; }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) { final_results = true; }
            else { final_results = false; }
            assertTrue("Failed, Tabula could not find the text-based image", final_results);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test of two instances trying to get a horizontal table to appear
    @Test
    public void TestHorizontalTable(){
        try {
            UploadPDF();
            PageRefresh();
            //Test for vertical table
            PatternInputStrings("Preperation", "Presentation");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));

            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result;
            if (result.equals("0")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            assertTrue("Failed, Tabula found a match for a vertical table",
                    regex_result);
            driver.navigate().refresh();

            //Test of a different vertical table
            PageRefresh();
            PatternInputStrings("Impacts", "Lack of interest");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result2;
            if (result2.equals("0")) {
                regex_result2 = true;
            } //if true, there are zero matches
            else {
                regex_result2 = false;
            }
            assertTrue("Failed, Tabula found a match for a vertical table",
                    regex_result2);
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test of two instances to get multiple regex results
    @Test
    public void TestMultipleRegexSearches(){
        try {
            //Tests for 2 regex search results
            UploadPDF();
            PageRefresh();

            PatternInputStrings("Impacts", "Knowledge");
            InclusiveButtons(true, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));

            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'2')]")).getText();
            Boolean regex_result;
            if (result.equals("2")) {
                regex_result = true;
            } //if true, there are 2 matches
            else {
                regex_result = false;
            }
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Impacts on participating pupils')]")).getText();
            Boolean regex_data;
            if (result_data.equals("Impacts on participating pupils")) {
                regex_data = true;
            } else {
                regex_data = false;
            }
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Knowledge/appreciation of school')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("Knowledge/appreciation of school system and")) {
                regex_data2 = true;
            } else {
                regex_data2 = false;
            }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) {
                final_results = true;
            } else {
                final_results = false;
            }
            Thread.sleep(500);
            assertTrue("Failed, Tabula didn't find the 2 regex matches", final_results);
            driver.navigate().refresh();

            //Test for 3 regex search results
            PageRefresh();
            PatternInputStrings("Knowledge", "Foreign");
            InclusiveButtons(true, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));

            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'3')]")).getText();
            Boolean regex_result3;
            if (result2.equals("3")) {
                regex_result3 = true;
            } //if true, there are 3 matches
            else {
                regex_result3 = false;
            }
            PreviewandExportDatapg();
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Knowledge and awareness')]")).getText();
            Boolean regex_data3;
            if (result_data3.equals("Knowledge and awareness of different cultures")) {
                regex_data3 = true;
            } else {
                regex_data3 = false;
            }
            Thread.sleep(600);
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Foreign language')]")).getText();
            Boolean regex_data4;
            if (result_data4.equals("Foreign language competence")) {
                regex_data4 = true;
            } else {
                regex_data4 = false;
            }
            Boolean final_results2;
            if (regex_result3 && regex_data3 && regex_data4) {
                final_results2 = true;
            } else {
                final_results2 = false;
            }
            Thread.sleep(500);
            assertTrue("Failed, Tabula didn't find the 3 regex matches", final_results2);
            driver.navigate().back();
            Thread.sleep(500);
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test of a multipage spanning table
    @Test
    public void TestMultiPageTables(){
        try {
            //Test for a multi spanning page (2 page table)
            UploadPDF();
            PageRefresh();

            PatternInputStrings("Table 5", "Question 4.9");
            InclusiveButtons(false, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) {
                regex_result = true;
            } //if true, there is 1 match
            else {
                regex_result = false;
            }
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Correlations')]")).getText();
            Boolean regex_data;
            if (result_data.equals("Correlations between the extent of participation of pupils in project activities and the")) {
                regex_data = true;
            } else {
                regex_data = false;
            }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Question')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("Question 4.9: Overall, how satisfied are you with the outcomes and impacts of " +
                    "the Comenius project?")) {
                regex_data2 = true;
            } else {
                regex_data2 = false;
            }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) {
                final_results = true;
            } else {
                final_results = false;
            }
            assertTrue("Failed, Tabula found no match for the multi-page table", final_results);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test of an overlap attempt, and then checking that overlap was detected
    @Test
    public void TestOverlapRegexSearch() {
        try{
            //Test for overlapping regex searches
            UploadPDF();
            PageRefresh();

            PatternInputStrings("Table 5", "Impacts on");
            ClickRegexButton();
            Thread.sleep(600);
            PatternInputStrings("Table 6", "School climate");
            InclusiveButtons(false, true);
            ClickRegexButton();
            Thread.sleep(600);
            driver.switchTo().alert().accept(); //accept error pop-up window
            //Checks that there is only one regex result, since it shouldn't had allowed for 2 results to appear since the
            // 2nd one causes an overlap
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, Tabula found found more than one match for an overlap regex search",
                    regex_result);

            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test checking duplication of inputting the same regex searches twice to see if it will caught it
    @Test
    public void TestDuplicateOverlapRegexSearch(){
        try {
            //Test for a duplicate overlapping regex search
            UploadPDF();
            PageRefresh();
            PatternInputStrings("Table 5", "Table 6");
            InclusiveButtons(true, true);
            ClickRegexButton();
            Thread.sleep(600);
            PatternInputStrings("Table 5", "Table 6");
            InclusiveButtons(true, true);
            ClickRegexButton();
            Thread.sleep(600);
            driver.switchTo().alert().accept(); //accept error pop-up window
            //Checks that there is only one regex result, since it shouldn't had allowed for 2 results to appear since the
            // 2nd one causes a duplicate overlap
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            assertTrue("Failed, Tabula found more than one match for a duplicate overlap regex search",
                    regex_result);

            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @AfterClass
    public static void TearDown(){
        try{
            Files.move(new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }
        
        driver.quit();
    }
}
