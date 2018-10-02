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
import java.io.File;
import java.nio.file.Files;
import static java.nio.file.StandardCopyOption.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;

//Test of Tabula's Preview and Export Data page, including the links and buttons on both pages
// that it navigates. For the preview page it toggles between the two different types to display data and
// doesn't go into testing the preview's menu due to testing done already in the back-end on the different functionality.
// For this test case, eu_002.pdf is utilized.
// @author SM modified: 4/29/18
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
    public void startWebDriver() throws InterruptedException {
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        driver = new ChromeDriver(options);
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 500);
        String filePath = System.getProperty("user.dir") + "/test/pdf/eu-002.pdf";
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(5000);
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            PageRefresh();
            //clicks on the Autodetect Tables and waits for Tabula to detect something (this will not be extensively tested
            // for the sake that this is just a component test) then it wait and click the Preview & Export Data button
            By autodetect_id = By.id("restore-detected-tables");
            WebElement autodetect_button = wait.until(ExpectedConditions.elementToBeClickable(autodetect_id));
            autodetect_button.click();
            Thread.sleep(600);
            By previewandexport_id = By.id("all-data");
            WebElement previewandexport_button = driver.findElement(previewandexport_id);
            previewandexport_button.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("detection-row")));

            By revise_selections_id = By.id("revise-selections");
            WebElement revise_selections_button = wait.until(ExpectedConditions.elementToBeClickable(revise_selections_id));
            revise_selections_button.click();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            //checks that it navigated back to the extraction page
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.elementToBeClickable(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));
            driver.navigate().back();
            //counts the number of rows displayed when the stream button is set to default and compares the row count
            //Thread.sleep(1000);
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            List<WebElement> stream_rows = driver.findElements(By.className("detection-row"));
            int stream_count = stream_rows.size();
            int stream_hc_count = 38;
            assertTrue("Failed, number of rows, from the Stream option, did not match", (stream_hc_count == stream_count ));

            By lattice_id = By.id("spreadsheet-method-btn");
            WebElement lattice_button = wait.until(ExpectedConditions.elementToBeClickable(lattice_id));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            lattice_button.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("detection-row")));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
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
            By navbar_class = By.className("navbar-brand");
            WebElement navbar_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(navbar_class));
            navbar_icon.click();
            By delete_pdf = By.id("delete_pdf");
            WebElement delete_btn = wait.until(ExpectedConditions.elementToBeClickable(delete_pdf));
            delete_btn.click();
            driver.switchTo().alert().accept();

        }catch(Exception e){
            System.out.print(e);
        }
    }

    @Before 
    public void Setup() {
        try{
            Files.move(new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }
    }

    @After
    public void TearDown(){
        try{
            Files.move(new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }

        driver.quit();
    }
}
