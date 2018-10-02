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

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;

// Test of Tabula's homepage, menu, media links at the bottom of the page, and button to click window explorer to upload files.
// Test will not test for uploading a file or clicking the extracting button to navigate to the extraction page
// Test will not test the Help and Template links located in the How to Use Tabula section, since navigating to those sections are
//   already being done
// Currently, this test case will not check for the Import button since the button is technically enabled but disabled to do anything
// @author SM modified: 2/18/18

public class TestHomePage {
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

        try {
            //navbar-brand and upload-nav when clicked just stay in the homepage
            By navbar_class = By.className("navbar-brand");
            WebElement navbar_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(navbar_class));
            navbar_icon.click();

            By upload__id = By.linkText("My Files");
            WebElement upload_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(upload__id));
            upload_icon.click();

            By templates_id = By.linkText("My Templates");
            WebElement templates_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_id));
            templates_icon.click();

            String text_template = "My Saved Templates";
            By saved_template_classname = By.className("my_saved_template_title");
            WebElement template_title = wait.until(ExpectedConditions.visibilityOfElementLocated(saved_template_classname));
            assertTrue("Failed, couldn't find My Templates page", text_template.equals(template_title.getText()));
            driver.navigate().back();

            By about_id = By.linkText("About");
            WebElement about_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(about_id));
            about_icon.click();

            String about_title = "About Tabula";
            By abouttabula_classname = By.className("abouttabula");
            WebElement abouttabula = wait.until(ExpectedConditions.visibilityOfElementLocated(abouttabula_classname));
            assertTrue("Failed, couldn't find About page", about_title.equals(abouttabula.getText()));
            driver.navigate().back();

            By help_id = By.linkText("Help");
            WebElement help_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(help_id));
            help_icon.click();

            String help_title = "How to Use Tabula";
            By helptabula_id = By.id("tabulahelp");
            WebElement helptabula = wait.until(ExpectedConditions.visibilityOfElementLocated(helptabula_id));
            assertTrue("Failed, couldn't find Help page", help_title.equals(helptabula.getText()));
            driver.navigate().back();

            By source_code_id = By.linkText("Source Code");
            WebElement source_code_icon = wait.until(ExpectedConditions.elementToBeClickable(source_code_id));
            source_code_icon.click();

            String github_url = "https://github.com/tabulapdf/tabula";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tabula's GitHub page", driver.getCurrentUrl().equals(github_url));
            driver.navigate().back();

            //Test of home page's media links located in the bottom of the page
            By tabulatwt_classname = By.linkText("@TabulaPDF");
            WebElement tabula_twitter_icon = wait.until(ExpectedConditions.elementToBeClickable(tabulatwt_classname));
            tabula_twitter_icon.click();
            String tabula_twitter_url = "https://twitter.com/tabulapdf?lang=en";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tabula's Twitter page", driver.getCurrentUrl().equals(tabula_twitter_url));
            driver.navigate().back();

            // https://tabula.technology's url is hard to check because of network issues causing it to not
            // consistently load the page without a warning

            By tabulapdfoc_classname = By.linkText("Tabulapdf");
            WebElement tabulapdfoc_icon = wait.until(ExpectedConditions.elementToBeClickable(tabulapdfoc_classname));
            tabulapdfoc_icon.click();
            String tabulapdfoc_url = "https://opencollective.com/tabulapdf";
            driver.manage().timeouts().pageLoadTimeout(200, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tabula's Opencollective page", driver.getCurrentUrl().equals(tabulapdfoc_url));
            driver.navigate().back();

            //Checking for smaller links located in How to use Tabula steps in the home page, but not the links
            // for templates or the help page
            By libreoffice_text = By.linkText("LibreOffice Calc");
            WebElement libreoffice_link = wait.until(ExpectedConditions.elementToBeClickable(libreoffice_text));
            libreoffice_link.click();
            String libreoffice_url = "https://www.libreoffice.org/discover/calc/";
            driver.manage().timeouts().pageLoadTimeout(200, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find LibreOffice Calc page", driver.getCurrentUrl().equals(libreoffice_url));
            driver.navigate().back();

            //Checking Browse button, which will open up File Explorer
            By input_btn = By.className("input-group-btn");
            WebElement input_browser = wait.until(ExpectedConditions.elementToBeClickable(input_btn));
            input_browser.click();
            Thread.sleep(1000);

        }catch(Exception e){
            System.out.print(e); }
    }

    @Before 
    public void Setup() {
        try{
            Files.move(new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }
    }

    //whether the test case passes or not, the instance of the browser will close
    @After
    public void TearDown(){
        try{
            Files.move(new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }

        driver.quit();
    }
}
