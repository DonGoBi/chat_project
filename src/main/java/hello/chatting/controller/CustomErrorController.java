package hello.chatting.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;


@Slf4j
@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        
        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            log.error("Error occurred with status code: {} at URI: {}", statusCode, request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI));

            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                // 404 발생 시 리액트 라우팅이 처리할 수 있도록 index.html로 포워딩
                return "forward:/";
            }
        }
        
        // 기타 에러는 기본 에러 처리(또는 리액트 메인)로 보냄
        return "forward:/";
    }
}
