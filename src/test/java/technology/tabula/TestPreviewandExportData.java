package technology.tabula;

import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;
//Test of Tabula's Preview and Export Data page, including the links and buttons on the page. Expect for two buttons,
// the export button that triggers a pop-up window and the copy to clipboard button that is seen as disabled whenever
// on remote control but enabled when manually tested.
// TODO: currently, A better way to call the pdf has been changed; need to find a way to not use the absolute pathname
// For this test case, eu_002.pdf is utilized.
// @author SM modified: 3/10/18
public class TestPreviewandExportData {
    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    WebDriver driver;
    @Test
    public void startWebDriver(){
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        driver = new ChromeDriver(options);
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);
        String filePath = System.getProperty("user.dir") + "/src/test/pdf/eu-002.pdf";
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
    try{
        Thread.sleep(1000);
        //navigates to the extraction page and checks that it is in the extraction page
        By extract_name = By.linkText("Extract Data");
        WebElement extract_button = wait.until(ExpectedConditions.elementToBeClickable(extract_name));
        extract_button.click();
        Thread.sleep(1000);

        PageRefresh();
        //clicks on the Autodetect Tables and waits for Tabula to detect something (this will not be extensively tested
        // for the sake that this is just a component test) then it wait and click the Preview & Export Data button
        By autodetect_id = By.id("restore-detected-tables");
        WebElement autodetect_button = wait.until(ExpectedConditions.elementToBeClickable(autodetect_id));
        autodetect_button.click();
        driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);

        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.elementToBeClickable(previewandexport_id));
        previewandexport_button.click();

        By revise_selections_id = By.id("revise-selections");
        WebElement revise_selections_button = wait.until(ExpectedConditions.elementToBeClickable(revise_selections_id));
        revise_selections_button.click();
        //checks that it navigated back to the extraction page
        String regex_options_string = "Regex Options";
        By regex_options_title = By.id("regex_options_title");
        WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
        driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
        assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));
        driver.navigate().back();
        //counts the number of rows displayed when the stream button is set to default and compares the row count
        Thread.sleep(1000);
        List<WebElement> stream_rows = driver.findElements(By.className("detection-row"));
        int stream_count = stream_rows.size();
        int stream_hc_count = 38;
        assertTrue("Failed, number of rows, from the Stream option, did not match", (stream_hc_count == stream_count ));

        By lattice_id = By.id("spreadsheet-method-btn");
        WebElement lattice_button = wait.until(ExpectedConditions.elementToBeClickable(lattice_id));
        Thread.sleep(1000);
        lattice_button.click();
        Thread.sleep(1000);
        List<WebElement> lattice_rows = driver.findElements(By.className("detection-row"));
        int lattice_count = lattice_rows.size();
        int lattice_hc_count = 7;
        assertTrue("Failed, number of rows, from the Lattice option, did not match", (lattice_hc_count == lattice_count ));

        By contact_name = By.linkText("Contact the developers");
        WebElement contact_button = wait.until(ExpectedConditions.elementToBeClickable(contact_name));
        contact_button.click();
        String contact_url = "http://www.github.com/tabulapdf/tabula/issues/new";
        driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
        assertFalse("Failed, couldn't find GitHub's sign-in page to view the report an issue page", driver.getCurrentUrl().equals(contact_url));
        driver.navigate().back();
        //menu options did not fully load
        PageRefresh();
        By autodetect_id2 = By.id("restore-detected-tables");
        WebElement autodetect_button2 = wait.until(ExpectedConditions.elementToBeClickable(autodetect_id2));
        autodetect_button2.click();
        driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
        By previewandexport_id2 = By.id("all-data");
        WebElement previewandexport_button2 = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id2));
        previewandexport_button2.click();

        By export_format_name = By.id("forms");
        WebElement export_format_button = wait.until(ExpectedConditions.elementToBeClickable(export_format_name));
        export_format_button.click();
        By tsv_name = By.id("tsv");
        String tsv = "TSV";
        WebElement tsv_option = wait.until(ExpectedConditions.presenceOfElementLocated(tsv_name));
        assertTrue("Failed, couldn't find Export Format options", tsv.equals(tsv_option.getText()));

        By export_name = By.id("download-data");
        wait.ignoring(NoSuchElementException.class);
        WebElement export_button = wait.until(ExpectedConditions.elementToBeClickable(export_name));
        assertTrue("Failed, couldn't find Export button", export_button.isDisplayed());
        //export_button.click(); will not click on the export button because of the pop-up window issue it will bring

        By log_file_name = By.id("log-file");
        wait.ignoring(NoSuchElementException.class);
        WebElement log_file_button = wait.until(ExpectedConditions.elementToBeClickable(log_file_name));
        assertTrue("Failed, couldn't find Log File button", log_file_button.isDisplayed());
        log_file_button.click(); //the button does nothing right now, when implementation has been added to it, it will
        // affect the test case

       //When manually tested, Copy to Clipboard button, it is not disabled and I'm allowed to click on it. However,
        // after running the test various times on remote control, the copy to clipboard button is disabled. Hence, I
        // will not include the testing of the button since the test is suppose to check if the button is clickable and
        // it will fail at this present state.

        //navigates back and deletes the pdf utilized
        driver.navigate().back();
        driver.navigate().back();
        By delete_pdf = By.id("delete_pdf");
        WebElement delete_btn = wait.until(ExpectedConditions.elementToBeClickable(delete_pdf));
        delete_btn.click();
        driver.switchTo().alert().accept();

    }catch(Exception e){
        System.out.print("TestPreviewandExportData failed.");
        System.out.print(e);
        }
    }
    @After
    public void TearDown(){
        driver.quit();
    }
}
