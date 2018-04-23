import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;

public class TestExhibit_1 {
    private WebDriver driver;
    private String Tabula_url = "http://127.0.0.1:9292/";

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
        WebDriverWait wait = new WebDriverWait(driver, 100);
        WebElement previewandexport_button = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("all-data"))));
        previewandexport_button.click();
    }
    private void ClickRegexButton()  {
        WebDriverWait wait = new WebDriverWait(driver, 100);
        WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("regex-search"))));
        regex_button.click();
    }
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);

    }
    private void InclusiveButtons(boolean patternbefore, boolean patternafter){
        WebDriverWait wait = new WebDriverWait(driver, 100);
        WebElement inclusive_before_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_before"))));
        WebElement inclusive_after_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_after"))));
        if (patternbefore){
            inclusive_before_btn.click();
        }
        if(patternafter){
            inclusive_after_btn.click();
        }
    }
    @Before
    public void Setup() throws InterruptedException {
        System.setProperty("webdriver.chrome.driver", "/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        //options.addArguments("headless");
        options.addArguments("no-sandbox");

        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);

        String filePath = System.getProperty("user.dir") + "/src/test/pdf/NC_HOUSE_2017_Stat_Pack_8.21.17.pdf";
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        WebElement import_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("import_file"))));
        import_btn.click();
    }
    @Test
    public void TestMultipleRegexSyntax(){
        try{
            Thread.sleep(5000);
            WebDriverWait wait = new WebDriverWait(driver, 100);
            //navigating to the extraction page after uploading the file
         //   WebElement extract_button = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.linkText("Extract Data"))));
         //   extract_button.click();
            //calls pagerefresh to make sure the page has uploaded correctly
            PageRefresh();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);

            //inputs regex syntax and with inclusive buttons before and after patterns
            PatternInputStrings("(2017)+", "([7-9])\\w+");
            InclusiveButtons(true, false);
            ClickRegexButton();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            Thread.sleep(7000);

            //confirmation of data picked and number of results from the regex results table in the extraction page
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'19')]")).getText();
            Boolean regex_result;
            if(result.equals("19")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            Thread.sleep(600);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'2017 House Redistricting Plan: Population Deviation')]")).getText();
            Boolean regex_data;
            if(result_data.equals("2017 House Redistricting Plan: Population Deviation")){ regex_data = true;}
            else{ regex_data = false;}
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'District Rep Rep % Dem Dem')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("District Rep Rep % Dem Dem % Lib Lib % Write-In Write-In %")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match/correct match for the regex search", final_results);
            driver.navigate().back();
            Thread.sleep(500);

            driver.navigate().refresh();
            PageRefresh();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);

            //Tests pattern before with a common input found in the pdf and pattern after with a correct input
            PatternInputStrings("([Dis])", "([100-200])+");
            ClickRegexButton();
            Thread.sleep(1000);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'33')]")).getText();
            Boolean regex_result2;
            if(result2.equals("33")){ regex_result2 = true;}
            else{ regex_result2 = false;}
            assertTrue("Failed, Tabula found no match/correct match for the regex search", regex_result2);

            driver.navigate().back();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            Thread.sleep(500);
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void MultiRegexResults(){

    }
    @Test
    public void TestMultiCombinationRegexSearches(){

    }
    @Test
    public void TestMultiPageSearch(){

    }
    @Test
    public void TestOverlapRegexSearch(){

    }
    @Test
    public void TestImage(){

    }
    @Test
    public void TestFooterandHeaderwithRegex(){

    }
    @After
    public void TearDown(){
        WebDriverWait wait = new WebDriverWait(driver, 100);
        //navigates back and deletes the pdf utilized
        wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("delete_pdf")))).click();
        driver.switchTo().alert().accept();
        driver.quit();
    }
}
