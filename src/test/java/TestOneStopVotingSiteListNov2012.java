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

import java.util.List;

import static junit.framework.TestCase.assertTrue;

//Test of the One_Stop_Voting_Site_List_Nov2012 pdf file.
public class TestOneStopVotingSiteListNov2012 {
    private static WebDriver driver;
    private static String Tabula_url = "http://127.0.0.1:9292/";
    private WebDriverWait wait = new WebDriverWait(driver, 100);

    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    private void PreviewandExportDatapg(){
        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id));
        previewandexport_button.click();
    }
    private void ClickRegexButton() throws InterruptedException {
        By regex_search_id = By.id("regex-search");
        WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id));
        regex_button.click();
        Thread.sleep(500);
    }
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);
    }
    private void InclusiveButtons(boolean patternbefore, boolean patternafter){
        WebElement inclusive_before_btn = new WebDriverWait(driver, 30).until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_before"))));
        WebElement inclusive_after_btn = new WebDriverWait(driver, 30).until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_after"))));
        if (patternbefore){
            inclusive_before_btn.click();
        }

        if(patternafter){
            inclusive_after_btn.click();
        }
    }
    private void UploadPDF() throws InterruptedException {
        String filePath = "/home/slmendez/484_P7_1-GUI/src/test/pdf/One_Stop_Voting_Site_List_Nov2012.pdf"; //
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(10000);
    }
    private void DeletePDF(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
    }
    @BeforeClass
    public static void SetUp() throws InterruptedException {
        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
       // options.addArguments("headless");

        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();
    }
    @Test
    public void TestMultiPageTables() {
        try {
            UploadPDF();
            PageRefresh();

            //Test of regex input with inclusive for pattern before for a table of 2 pages in length
            PatternInputStrings("JEFFERSON", "BRUNSWICK");
            WebElement inclusive_before_btn = driver.findElement(By.id("include_pattern_before"));
            inclusive_before_btn.click();
            ClickRegexButton();
            Thread.sleep(5000);
            //Confirm a result shows up in the regex search table
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            PreviewandExportDatapg();
            Thread.sleep(5000);
            //verify data extraction
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'JEFFERSON')]")).getText();
            Boolean regex_data;
            if (result_data.equals("JEFFERSON, NC 28640")) {
                regex_data = true;
            } else {
                regex_data = false;
            }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'DUBLIN')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("DUBLIN, NC 28332")) {
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
            assertTrue("Failed, regex found no match for inclusive input for pattern before for a 2 page length table"
                    , final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Test of regex input with inclusive for pattern after for a table of 5 pages in length
            PatternInputStrings("CHEROKEE", "CUMBERLAND");
            ClickRegexButton();
            Thread.sleep(5000);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if (result3.equals("1")) {
                regex_result3 = true;
            } //if true, there are zero matches
            else {
                regex_result3 = false;
            }
            PreviewandExportDatapg();
            Thread.sleep(5000);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CHEROKEE')]")).getText();
            Boolean regex_data5;
            if (result_data5.equals("CHEROKEE COUNTY BOARD OF ELECTIONS OFFICE")) {
                regex_data5 = true;
            } else {
                regex_data5 = false;
            }
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CUMBERLAND')]")).getText();
            Boolean regex_data6;
            if (result_data6.equals("CUMBERLAND")) {
                regex_data6 = true;
            } else {
                regex_data6 = false;
            }
            Boolean final_results3;
            if (regex_result3 && regex_data5 && regex_data6) {
                final_results3 = true;
            } else {
                final_results3 = false;
            }
            assertTrue("Failed, Tabula found no match for a multi page table spanning more than 2 pages", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestInclusivePatternswithRegexSearches() {
        try{
            UploadPDF();
            PageRefresh();

            //Tests for inclusive for pattern before and non-inclusive for pattern after
            PatternInputStrings("2017 House Redistricting","69");
            InclusiveButtons(true, false);
            ClickRegexButton();
            Thread.sleep(5000);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'14')]")).getText();
            Boolean regex_result;
            if(result.equals("14")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            Thread.sleep(4000);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'2017 House Redistricting Plan: Population Deviation')]")).getText();
            Boolean regex_data;
            if(result_data.equals("2017 House Redistricting Plan: Population Deviation")){ regex_data = true;}
            else{ regex_data = false;}
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'District')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("District 2010 Pop")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern before and non-inclusive for " +
                    "pattern after", final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for non-inclusive for pattern before and inclusive for pattern after
            PatternInputStrings("2017 House Redistricting", "69");
            InclusiveButtons(false, true);
            ClickRegexButton();
            Thread.sleep(5000);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'14')]")).getText();
            Boolean regex_result3;
            if(result2.equals("14")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            Thread.sleep(4000);
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'District')]")).getText();
            System.out.print(result_data3);
            Boolean regex_data3;
            if(result_data3.equals("District")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            Thread.sleep(600);
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'105')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("105")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result3 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and non-inclusive for " +
                    "pattern before", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for inclusive for pattern before and for pattern after
            PatternInputStrings("2017 House Redistricting","69");
            InclusiveButtons(true, true);
            Thread.sleep(500);
            ClickRegexButton();
            Thread.sleep(4000);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'14')]")).getText();
            Boolean regex_result4;
            if(result3.equals("14")){ regex_result4 = true;} //if true, there are zero matches
            else{ regex_result4 = false;}
            PreviewandExportDatapg();
            Thread.sleep(5000);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'2017 House Redistricting Plan: Population Deviation')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("2017 House Redistricting Plan: Population Deviation")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            Thread.sleep(600);
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'105 22,913 55.44% 17,133 41.45% 1,287 3.11%')]")).getText();
            Boolean regex_data6;
            if(result_data6.equals("105 22,913 55.44% 17,133 41.45% 1,287 3.11%")){ regex_data6 = true;}
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
    @Test
    public void TestOverlapRegexSearch() {
        try{
            //Test for overlapping regex searches
            UploadPDF();
            PageRefresh();

            PatternInputStrings("District", "Total");
            ClickRegexButton();
            Thread.sleep(5000);
            PatternInputStrings("2017 House", "District");
            InclusiveButtons(false, true);
            ClickRegexButton();
            Thread.sleep(5000);
            driver.switchTo().alert().accept(); //accept error pop-up window
            //Checks that there is only one regex result, since it shouldn't had allowed for 2 results to appear since the
            // 2nd one causes an overlap
            List<WebElement> regex_rows = driver.findElements(By.className("regex-result-row"));
            int regex_count = regex_rows.size();
            int regex_count1 = 1;
            assertTrue("Failed, number of rows, from the Stream option, did not match", (regex_count1 == regex_count ));

            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, Tabula found found more than one match for an overlap regex search",
                    regex_result);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestRegexSyntax(){

    }
    @AfterClass
    public static void TearDown(){
        driver.quit();
    }
}
